"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { DealsByStage } from "@/services/dashboard.service";

const chartConfig: ChartConfig = {
  deal_count: { label: "Deals" },
};

export function DealsByStageChart({ data }: { data: DealsByStage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals por etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="stage_name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="deal_count" radius={6}>
              {data.map((stage) => (
                <Cell key={stage.stage_id} fill={stage.color ?? "var(--color-chart-1)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
