"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { ErpMonthlyTrend } from "@/services/dashboard.service";

const chartConfig: ChartConfig = {
  revenue: { label: "Ingresos", color: "#22c55e" },
  variable_expenses: { label: "Gastos variables", color: "#ef4444" },
};

function monthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
}

export function RevenueCostTrendChart({ data }: { data: ErpMonthlyTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs gastos variables</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => monthLabel(value)}
            />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => monthLabel(String(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="var(--color-revenue)"
              fillOpacity={0.15}
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
            <Area
              dataKey="variable_expenses"
              type="monotone"
              fill="var(--color-variable_expenses)"
              fillOpacity={0.15}
              stroke="var(--color-variable_expenses)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
