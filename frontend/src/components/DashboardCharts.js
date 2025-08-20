import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import SankeyChart from './SankeyChart';
import ContributionHeatmap from './ContributionHeatmap';



// Timeline Area Chart Component
const ApplicationsOverTime = ({ data }) => {
  const timelineData = useMemo(() => {
    const dailyData = {};
    
    // Group applications by date
    data.forEach(app => {
      const date = new Date(app.dateApplied);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = 0;
      }
      dailyData[dateKey]++;
    });

    // Convert to chart format and fill missing dates
    const sortedDates = Object.keys(dailyData).sort();
    const chartData = [];
    
    if (sortedDates.length > 0) {
      const startDate = new Date(sortedDates[0]);
      const endDate = new Date(sortedDates[sortedDates.length - 1]);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        chartData.push({
          date: d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          applications: dailyData[dateKey] || 0,
          fullDate: dateKey
        });
      }
    }

    return chartData;
  }, [data]);

  const stats = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return { last30: 0, avgPerDay: 0 };
    const lastIndex = timelineData.length - 1;
    const last30Start = Math.max(0, lastIndex - 29);
    const last30 = timelineData.slice(last30Start).reduce((sum, d) => sum + (d.applications || 0), 0);
    const avgPerDay = (timelineData.reduce((s, d) => s + (d.applications || 0), 0) / timelineData.length) || 0;
    return { last30, avgPerDay: Math.round(avgPerDay * 10) / 10 };
  }, [timelineData]);

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Applications Over Time
          </CardTitle>
          <CardDescription>
            Your application activity timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Applications Over Time
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Past 30 days: <span className="text-foreground font-medium">{stats.last30}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground">
              Avg/day: <span className="text-foreground font-medium">{stats.avgPerDay}</span>
            </span>
          </div>
        </div>
        <CardDescription>Your application activity timeline</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'rgba(148,163,184,0.8)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(148,163,184,0.8)' }} tickLine={false} axisLine={false} />
            <Tooltip
              isAnimationActive
              formatter={(value) => [value, 'Applications']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                background: 'rgba(17,24,39,0.85)',
                color: '#e5e7eb',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 8,
                backdropFilter: 'blur(6px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
              }}
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="#3B82F6"
              fill="url(#fillApps)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={1200}
              animationBegin={200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Charts Component
export const DashboardCharts = ({ internships }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-y-0">
        <div style={{ minHeight: 380 }}>
          <SankeyChart data={internships} />
        </div>
      </div>
      <div className="transition-all duration-[1200ms] delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-y-0">
        <div style={{ minHeight: 380 }}>
          <ApplicationsOverTime data={internships} />
        </div>
      </div>
      <div className="lg:col-span-2 transition-all duration-[1200ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 translate-y-0">
        <ContributionHeatmap internships={internships} />
      </div>
    </div>
  );
};

export default DashboardCharts; 