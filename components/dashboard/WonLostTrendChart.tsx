"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import type { DealsWonLostMonthly } from "@/services/dashboard.service";

const chartConfig: ChartConfig = {
  won_count: { label: "Ganados", color: "#22c55e" },
  lost_count: { label: "Perdidos", color: "#ef4444" },
};

function monthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
}

export function WonLostTrendChart({ data }: { data: DealsWonLostMonthly[] }) {
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals ganados vs perdidos</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
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
                dataKey="won_count"
                type="monotone"
                fill="var(--color-won_count)"
                fillOpacity={0.15}
                stroke="var(--color-won_count)"
                strokeWidth={2}
              />
              <Area
                dataKey="lost_count"
                type="monotone"
                fill="var(--color-lost_count)"
                fillOpacity={0.15}
                stroke="var(--color-lost_count)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Aún no hay historial de cierres para mostrar una tendencia.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
