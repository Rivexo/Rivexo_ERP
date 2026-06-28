"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import type { DealsByStage } from "@/services/dashboard.service";

const chartConfig: ChartConfig = {
  total_value: { label: "Valor" },
};

export function PipelineDistributionChart({ data }: { data: DealsByStage[] }) {
  const openStages = data.filter((stage) => !stage.is_won && !stage.is_lost && (stage.total_value ?? 0) > 0);
  const hasData = openStages.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución del pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex w-full items-center gap-2">
                        <div
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: item.payload?.color ?? undefined }}
                        />
                        <span className="flex-1 text-muted-foreground">{item.payload?.stage_name}</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie data={openStages} dataKey="total_value" nameKey="stage_name" innerRadius={60} strokeWidth={2}>
                {openStages.map((stage) => (
                  <Cell key={stage.stage_id} fill={stage.color ?? "var(--color-chart-1)"} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sin valor en pipeline abierto todavía.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
