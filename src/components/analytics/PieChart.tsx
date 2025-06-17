import { useTheme } from 'next-themes';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#d946ef'
];

interface PieChartProps {
  data: { name: string; value: number }[];
  title?: string;
  className?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChart({
  data,
  title,
  className,
  height = 300,
  innerRadius = 60,
  outerRadius = 80,
}: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, payload: data } = payload[0];
      const percentage = ((value / data.total) * 100).toFixed(1);
      
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
          <p className="font-medium">{name}</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Clicks: </span>
            <span className="font-medium">{value}</span>
            <span className="text-muted-foreground"> ({percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend formatter
  const renderColorfulLegendText = (value: string, entry: any) => {
    const { color } = entry;
    return (
      <span style={{ color: isDark ? '#e5e7eb' : '#1f2937' }}>
        {value}
      </span>
    );
  };

  // Add total to each data point for percentage calculation
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({
    ...item,
    total,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
  }));

  if (!data || data.length === 0 || total === 0) {
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
          <RechartsPieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke={isDark ? '#1f2937' : '#ffffff'}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend 
              formatter={renderColorfulLegendText}
              wrapperStyle={{
                fontSize: '0.75rem',
                paddingTop: '1rem',
              }}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
