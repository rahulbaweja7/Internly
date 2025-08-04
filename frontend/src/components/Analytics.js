import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, TrendingUp, Calendar, BarChart3, PieChart, Target } from 'lucide-react';
import { Navbar } from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { DashboardCharts } from './DashboardCharts';

export function Analytics() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch jobs from backend
  const fetchJobs = () => {
    axios.get("http://localhost:3001/api/jobs")
      .then((res) => {
        console.log('Fetched jobs for analytics:', res.data);
        setInternships(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto p-6 max-w-7xl relative z-10">
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
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Applications</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{totalApplications}</div>
              <p className="text-xs text-blue-600 mt-1">All time applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Accepted</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{acceptedCount}</div>
              <p className="text-xs text-green-600 mt-1">Successful applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Interviewing</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">{interviewingCount}</div>
              <p className="text-xs text-orange-600 mt-1">In interview process</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Rejected</CardTitle>
              <PieChart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">{rejectedCount}</div>
              <p className="text-xs text-red-600 mt-1">Not selected</p>
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
          <Card className="text-center py-12">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
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

              <Card>
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