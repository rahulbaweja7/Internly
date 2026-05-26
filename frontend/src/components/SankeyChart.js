import React, { useMemo } from 'react';
import { Sankey, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NODE_COLORS = {
  Total: '#6366f1',
  Applied: '#3b82f6',
  Interviewing: '#f59e0b',
  Accepted: '#10b981',
  Rejected: '#ef4444',
};

const STATUS_MAP = {
  'Applied': 'Applied',
  'Online Assessment': 'Interviewing',
  'Phone Interview': 'Interviewing',
  'Technical Interview': 'Interviewing',
  'Final Interview': 'Interviewing',
  'Accepted': 'Accepted',
  'Rejected': 'Rejected',
  'Waitlisted': 'Applied',
  'Withdrawn': 'Rejected',
};

const SankeyChart = ({ data }) => {
  const { isDarkMode } = useTheme();

  const sankeyData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const counts = {};
    data.forEach(app => {
      const bucket = STATUS_MAP[app.status] || app.status;
      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    const buckets = ['Applied', 'Interviewing', 'Accepted', 'Rejected'].filter(b => counts[b] > 0);
    const nodes = [{ name: 'Total' }, ...buckets.map(name => ({ name }))];
    const links = buckets.map((name, i) => ({
      source: 0,
      target: i + 1,
      value: counts[name],
    }));

    return { nodes, links };
  }, [data]);

  const linkColors = isDarkMode
    ? ['rgba(147,197,253,0.6)', 'rgba(245,158,11,0.6)', 'rgba(34,197,94,0.6)', 'rgba(239,68,68,0.6)']
    : ['rgba(59,130,246,0.4)', 'rgba(245,158,11,0.4)', 'rgba(16,185,129,0.4)', 'rgba(239,68,68,0.4)'];

  const labelColor = isDarkMode ? '#e5e7eb' : '#374151';

  if (!sankeyData) {
    return (
      <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Status Flow
          </CardTitle>
          <CardDescription>Visual representation of your application statuses</CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Application Status Flow
        </CardTitle>
        <CardDescription>Visual representation of your application statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Sankey
            data={sankeyData}
            nodePadding={24}
            nodeWidth={16}
            linkCurvature={0.5}
            margin={{ top: 10, right: 110, bottom: 10, left: 30 }}
            node={(props) => {
              const { x, y, width, height, payload } = props;
              const name = payload?.name || '';
              const fill = NODE_COLORS[name] || '#64748b';
              return (
                <g>
                  <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} opacity={0.9} />
                  {name === 'Total' ? (
                    <text
                      x={Math.max(0, x - 8)}
                      y={y + height / 2 + 4}
                      textAnchor="end"
                      fontSize={12}
                      fill={labelColor}
                    >
                      {name}
                    </text>
                  ) : (
                    <text
                      x={x + width + 8}
                      y={y + height / 2 + 4}
                      fontSize={12}
                      fill={labelColor}
                    >
                      {`${name} (${payload.value})`}
                    </text>
                  )}
                </g>
              );
            }}
            link={(props) => {
              const { sourceX, sourceY, targetX, targetY, sourceControlX, linkWidth, index } = props;
              const color = linkColors[index % linkColors.length];
              return (
                <path
                  d={`M ${sourceX} ${sourceY} Q ${sourceControlX} ${sourceY} ${targetX} ${targetY}`}
                  stroke={color}
                  strokeWidth={Math.max(1, linkWidth)}
                  fill="none"
                  opacity={0.8}
                />
              );
            }}
          >
            <Tooltip formatter={(v) => [`${v} applications`]} />
          </Sankey>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SankeyChart;
