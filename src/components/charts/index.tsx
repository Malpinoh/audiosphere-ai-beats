
import * as React from "react";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// Color palette for charts
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  height?: number | string;
}

export const LineChart = ({
  data,
  index,
  categories,
  colors = ["primary"],
  className,
  showGrid = true,
  showLegend = true,
  valueFormatter = (value) => value.toString(),
  height = "100%",
}: ChartProps) => {
  const chartConfig = React.useMemo(() => {
    return Object.fromEntries(
      categories.map((category, i) => [
        category,
        {
          label: category,
          color: `hsl(var(--${colors[i % colors.length]}))`,
        },
      ])
    );
  }, [categories, colors]);

  return (
    <ChartContainer 
      config={chartConfig} 
      className={cn("h-full w-full", className)}
    >
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <Tooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={`hsl(var(--${colors[i % colors.length]}))`}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
};

export const BarChart = ({
  data,
  index,
  categories,
  colors = ["primary"],
  className,
  showGrid = true,
  showLegend = true,
  valueFormatter = (value) => value.toString(),
  height = "100%",
}: ChartProps) => {
  const chartConfig = React.useMemo(() => {
    return Object.fromEntries(
      categories.map((category, i) => [
        category,
        {
          label: category,
          color: `hsl(var(--${colors[i % colors.length]}))`,
        },
      ])
    );
  }, [categories, colors]);

  return (
    <ChartContainer 
      config={chartConfig} 
      className={cn("h-full w-full", className)}
    >
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <Tooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`hsl(var(--${colors[i % colors.length]}))`}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

interface PieChartProps {
  data: any[];
  index: string;
  category: string;
  className?: string;
  valueFormatter?: (value: number) => string;
  height?: number | string;
}

export const PieChart = ({
  data,
  index,
  category,
  className,
  valueFormatter = (value) => value.toString(),
  height = "100%",
}: PieChartProps) => {
  const chartConfig = React.useMemo(() => {
    return Object.fromEntries(
      data.map((item, i) => [
        item[index],
        {
          label: item[index],
          color: COLORS[i % COLORS.length],
        },
      ])
    );
  }, [data, index]);

  return (
    <ChartContainer 
      config={chartConfig} 
      className={cn("h-full w-full", className)}
    >
      <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <Pie
          data={data}
          dataKey={category}
          nameKey={index}
          cx="50%"
          cy="50%"
          outerRadius={80}
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
      </RechartsPieChart>
    </ChartContainer>
  );
};

// Trendline component is a simple extension of LineChart
export const Trendline = (props: ChartProps) => {
  return <LineChart {...props} showGrid={false} />;
};
