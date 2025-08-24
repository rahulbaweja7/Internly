import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, TrendingUp, Calendar, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { Navbar } from './Navbar';
import { DashboardCharts } from './DashboardCharts';
import { useData } from '../contexts/DataContext';

export function Analytics() {
  const { jobs: internships, loading } = useData();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const statusCounts = internships.reduce((acc, internship) => {
    acc[internship.status] = (acc[internship.status] || 0) + 1;
    return acc;
  }, {});

  const totalApplications = internships.length;
  const acceptedCount = statusCounts.Accepted || 0;
  const rejectedCount = statusCounts.Rejected || 0;
  const interviewingCount = (statusCounts['Online Assessment'] || 0) + 
                           (statusCounts['Phone Interview'] || 0) + 
                           (statusCounts['Technical Interview'] || 0) + 
                           (statusCounts['Final Interview'] || 0);

      return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <Navbar />

      <div className={`container mx-auto p-6 max-w-7xl relative z-10 transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Visualize your internship application journey and track your progress
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Briefcase className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">All time applications</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle2 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acceptedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Successful applications</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">In interview process</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Not selected</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : internships.length === 0 ? (
          <Card className="text-center py-12 rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                Add some internship applications to see your analytics and insights.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DashboardCharts internships={internships} />
        )}

        {/* Additional Insights Section */}
        {internships.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Application Success Rate
                  </CardTitle>
                  <CardDescription>
                    Your conversion rate from application to acceptance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {acceptedCount} out of {totalApplications} applications accepted
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Interview Success Rate
                  </CardTitle>
                  <CardDescription>
                    How often you progress to interview stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {totalApplications > 0 ? Math.round((interviewingCount / totalApplications) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {interviewingCount} applications reached interview stage
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics; 