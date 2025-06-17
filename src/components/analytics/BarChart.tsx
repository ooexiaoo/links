import { useTheme } from 'next-themes';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: { name: string; value: number }[];
  title?: string;
  className?: string;
  height?: number;
  barColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function BarChart({
  data,
  title,
  className,
  height = 300,
  barColor = '#3b82f6',
  xAxisLabel,
  yAxisLabel,
}: BarChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Clicks: </span>
            <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Format value for Y axis
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px]`}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={sortedData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
            barSize={20}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
            />
            <XAxis
              dataKey="name"
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
              tickLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              height={60}
              interval={0}
              textAnchor="end"
              angle={-45}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
              tickLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                style: {
                  textAnchor: 'middle',
                  fill: isDark ? '#9ca3af' : '#6b7280',
                  fontSize: '0.75rem',
                },
              }}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar 
              dataKey="value" 
              fill={barColor}
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={1500}
            >
              {sortedData.map((entry, index) => (
                <text
                  key={`bar-label-${index}`}
                  x={index * 30 + 15}
                  y={height - 40}
                  textAnchor="middle"
                  fill={isDark ? '#e5e7eb' : '#1f2937'}
                  fontSize={12}
                >
                  {entry.value}
                </text>
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
