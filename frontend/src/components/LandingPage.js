import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, BarChart3, Search, Bell, Users, Target, TrendingUp } from 'lucide-react';
import { Navbar } from './Navbar';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const features = [
    {
      icon: Target,
      title: "Track Applications",
      description: "Keep track of all your internship applications in one organized dashboard"
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Get insights on your application success rate and interview progress"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Quickly find applications by company, position, or location"
    },
    {
      icon: Bell,
      title: "Status Updates",
      description: "Track application status from applied to offer with visual indicators"
    },
    {
      icon: Users,
      title: "Company Insights",
      description: "Store notes and track communication with potential employers"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your internship search progress over time"
    }
  ];

  const stats = [
    { label: "Students Tracking", value: "10,000+" },
    { label: "Applications Managed", value: "50,000+" },
    { label: "Success Rate", value: "85%" },
    { label: "Average Response Time", value: "2 weeks" }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6 text-center">
          <Badge variant="secondary" className="mb-4">
            Free Internship Tracking Platform
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Track Your Internship
            <br />
            <span className="text-primary">Applications</span> with Ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Stay organized and increase your chances of landing the perfect internship. 
            Track applications, manage deadlines, and monitor your progress all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button size="lg" onClick={() => navigate('/dashboard')} className="text-lg px-8 py-6">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/add')} className="text-lg px-8 py-6">
                  Add New Application
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/register')} className="text-lg px-8 py-6">
                  Start Tracking Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 dark:bg-gray-800/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Land Your Dream Internship
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to organize, 
              track, and optimize your internship search process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Simple Steps to Success
            </h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes and transform your internship search
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Add Applications</h3>
              <p className="text-muted-foreground">
                Input your internship applications with company details, positions, and deadlines
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Track Progress</h3>
              <p className="text-muted-foreground">
                Update application status and add notes as you progress through the process
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Land Your Dream Job</h3>
              <p className="text-muted-foreground">
                Stay organized and increase your chances of securing the perfect internship
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Organize Your Internship Search?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who have successfully tracked their applications 
            and landed amazing internships.
          </p>
          <Button size="lg" onClick={() => navigate('/dashboard')} className="text-lg px-8 py-6">
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Internly</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Internly. Built for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 