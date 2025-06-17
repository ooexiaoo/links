import { useTheme } from 'next-themes';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LineChartProps {
  data: { date: string; count: number }[];
  title?: string;
  className?: string;
  height?: number;
}

export function LineChart({ data, title, className, height = 300 }: LineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Format date for better readability
  const formatXAxis = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
          <p className="font-medium">{formatXAxis(label)}</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Clicks: </span>
            <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px]`}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
              tickLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
              tickLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
              axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: isDark ? '#4b5563' : '#d1d5db', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
