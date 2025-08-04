import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';

const SankeyChart = ({ data }) => {
  const sankeyData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    // Count applications by status
    const statusCounts = {};
    data.forEach(app => {
      const status = app.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Map statuses to match the desired categories
    const statusMapping = {
      'Applied': 'Applied',
      'Online Assessment': 'Interviewing',
      'Phone Interview': 'Interviewing', 
      'Technical Interview': 'Interviewing',
      'Final Interview': 'Interviewing',
      'Accepted': 'Accepted',
      'Rejected': 'Rejected',
      'Waitlisted': 'Applied',
      'Withdrawn': 'Rejected'
    };

    const mappedCounts = {};
    Object.entries(statusCounts).forEach(([status, count]) => {
      const mappedStatus = statusMapping[status] || status;
      mappedCounts[mappedStatus] = (mappedCounts[mappedStatus] || 0) + count;
    });

    // Create the exact data structure from the provided code
    const applied = mappedCounts['Applied'] || 0;
    const rejected = mappedCounts['Rejected'] || 0;
    const interviewing = mappedCounts['Interviewing'] || 0;
    const accepted = mappedCounts['Accepted'] || 0;

    return {
      applied,
      rejected,
      interviewing,
      accepted,
      total: data.length
    };
  }, [data]);

  if (!sankeyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Status Flow
          </CardTitle>
          <CardDescription>
            Visual representation of your application statuses
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Application Status Flow
        </CardTitle>
        <CardDescription>
          Visual representation of your application statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <Plot
            data={[
              {
                type: 'sankey',
                orientation: 'h',
                node: {
                  pad: 15,
                  thickness: 20,
                  line: { 
                    color: 'rgba(0,0,0,0.15)', 
                    width: 1 
                  },
                  label: ['Total', 'Applied', 'Rejected', 'Interviewing', 'Accepted'],
                  color: [
                    '#6366f1', // Total - indigo
                    '#3b82f6', // Applied - blue
                    '#ef4444', // Rejected - red
                    '#f59e0b', // Interviewing - amber
                    '#10b981'  // Accepted - emerald
                  ],
                  font: {
                    size: 12,
                    color: '#ffffff',
                    family: 'Inter, system-ui, sans-serif',
                    weight: '600'
                  }
                },
                link: {
                  source: [0, 0, 0, 0], // from Total
                  target: [1, 2, 3, 4], // to Applied, Rejected, Interviewing, Accepted
                  value: [sankeyData.applied, sankeyData.rejected, sankeyData.interviewing, sankeyData.accepted],
                  color: [
                    'rgba(59, 130, 246, 0.4)',   // Applied flow
                    'rgba(239, 68, 68, 0.4)',    // Rejected flow
                    'rgba(245, 158, 11, 0.4)',   // Interviewing flow
                    'rgba(16, 185, 129, 0.4)'    // Accepted flow
                  ],
                  hoverinfo: 'all',
                  hovertemplate: '<b>%{source.label}</b> → <b>%{target.label}</b><br>Applications: <b>%{value}</b><extra></extra>'
                },
              },
            ]}
            layout={{
              title: {
                text: 'Your Application Journey',
                font: { 
                  size: 16, 
                  color: '#1f2937',
                  family: 'Inter, system-ui, sans-serif',
                  weight: '600'
                },
                x: 0.5,
                y: 0.95
              },
              font: { 
                size: 11,
                family: 'Inter, system-ui, sans-serif'
              },
              width: 500,
              height: 350,
              margin: { t: 60, b: 30, l: 30, r: 30 },
              paper_bgcolor: '#f8fafc',
              plot_bgcolor: '#f8fafc',
              hovermode: 'closest',
              hoverlabel: {
                bgcolor: '#ffffff',
                bordercolor: '#e5e7eb',
                font: { size: 12, color: '#374151' }
              }
            }}
            config={{
              displayModeBar: false,
              responsive: true
            }}
            style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '12px'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SankeyChart; 