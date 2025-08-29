import React from 'react';
import { Sankey, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

// Lightweight, animated Sankey preview for the landing page.
// Data is static (preview only) but can be wired to real aggregates later.
export default function SankeyMiniChart() {
  const { isDarkMode } = useTheme();
  
  const data = {
    nodes: [
      { name: 'Total' },
      { name: 'Applied' },
      { name: 'Interviewing' },
      { name: 'Rejected' },
    ],
    links: [
      { source: 0, target: 1, value: 60 },
      { source: 0, target: 2, value: 10 },
      { source: 0, target: 3, value: 27 },
    ],
  };

  const nodeColors = {
    Total: '#6366f1',
    Applied: '#93c5fd',
    Interviewing: '#f59e0b',
    Rejected: '#ef4444',
  };

  // Define link colors that work well in both light and dark modes
  const linkColors = isDarkMode 
    ? ['rgba(147, 197, 253, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.6)'] // Brighter for dark mode
    : ['rgba(59, 130, 246, 0.4)', 'rgba(245, 158, 11, 0.4)', 'rgba(239, 68, 68, 0.4)']; // Standard for light mode

  return (
    <div style={{ width: '100%', height: 80 }}>
      <ResponsiveContainer>
        <Sankey
          data={data}
          nodePadding={24}
          nodeWidth={12}
          linkCurvature={0.5}
          isAnimationActive
          margin={{ top: 6, right: 90, bottom: 6, left: 30 }}
          node={(props) => {
            const { x, y, width, height, payload } = props;
            const name = payload?.name || '';
            const fill = nodeColors[name] || '#64748b';
            return (
              <g>
                <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} opacity={0.9} />
                {/* Right side labels for destinations; left for Total */}
                {name === 'Total' ? (
                  <text x={Math.max(0, x - 8)} y={y + height / 2 + 4} textAnchor="end" fontSize={10} fill="currentColor" style={{ pointerEvents: 'none' }}>
                    {name}
                  </text>
                ) : (
                  <text x={x + width + 8} y={y + height / 2 + 4} fontSize={10} fill="currentColor" style={{ pointerEvents: 'none' }}>
                    {name}
                  </text>
                )}
              </g>
            );
          }}
          link={(props) => {
            const { sourceX, sourceY, targetX, targetY, sourceControlX, linkWidth, index } = props;
            const linkColor = linkColors[index % linkColors.length];
            
            return (
              <path
                d={`M ${sourceX} ${sourceY} Q ${sourceControlX} ${sourceY} ${targetX} ${targetY}`}
                stroke={linkColor}
                strokeWidth={Math.max(1, linkWidth)}
                fill="none"
                opacity={0.8}
              />
            );
          }}
        >
          <Tooltip formatter={(v) => `${v}`} cursor={{ fill: 'transparent' }} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}


