import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Briefcase, ClipboardList, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { computeStats } from '../lib/statsUtils';

/**
 * @param {{ internships: Array, statusCounts: object }} props
 */
export function DashboardStats({ internships, statusCounts }) {
  const s = computeStats(internships.length, statusCounts);

  const stats = [
    { label: 'Total Applications', icon: Briefcase,    value: s.total,             color: 'text-blue-300' },
    { label: 'Online Assessments', icon: ClipboardList, value: s.onlineAssessments, color: 'text-violet-300' },
    { label: 'Interview',          icon: TrendingUp,    value: s.interview,         color: 'text-amber-300' },
    { label: 'Accepted',           icon: CheckCircle2,  value: s.accepted,          color: 'text-emerald-300' },
    { label: 'Rejected',           icon: XCircle,       value: s.rejected,          color: 'text-rose-300' },
    { label: 'Response Rate',      icon: TrendingUp,    value: `${s.responseRate}%`, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
            <CardTitle className="text-sm font-medium flex items-center gap-2 leading-tight">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl leading-none font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
