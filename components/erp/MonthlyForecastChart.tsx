"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type MonthlyForecastRow = {
  month: string;
  primary: number;
  secondary: number;
  is_projected?: boolean;
};

const MONTH_LABEL = new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" });

function monthLabel(value: string) {
  return MONTH_LABEL.format(new Date(`${value}-01T00:00:00`));
}

export function MonthlyForecastChart({
  title,
  description,
  rows,
  primaryLabel,
  secondaryLabel,
  primaryColor,
  secondaryColor,
}: {
  title: string;
  description?: string;
  rows: MonthlyForecastRow[];
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const chartConfig: ChartConfig = {
    primary: { label: primaryLabel, color: primaryColor },
    secondary: { label: secondaryLabel, color: secondaryColor },
  };
  const hasProjected = rows.some((r) => r.is_projected);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart data={rows} margin={{ left: 0, right: 12 }}>
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
            <Bar dataKey="primary" stackId="a" fill="var(--color-primary)" radius={[0, 0, 4, 4]}>
              {rows.map((row, i) => (
                <Cell key={i} fillOpacity={row.is_projected ? 0.4 : 1} />
              ))}
            </Bar>
            <Bar dataKey="secondary" stackId="a" fill="var(--color-secondary)" radius={[4, 4, 0, 0]}>
              {rows.map((row, i) => (
                <Cell key={i} fillOpacity={row.is_projected ? 0.4 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        {hasProjected && (
          <p className="mt-2 text-xs text-muted-foreground">
            Las barras más claras son proyección (suscripciones activas sin facturar todavía).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
