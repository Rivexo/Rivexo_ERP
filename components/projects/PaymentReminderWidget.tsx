import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Installment } from "@/services/installments.service";

const today = () => new Date().toISOString().slice(0, 10);

export function PaymentReminderWidget({
  installments,
  projectId,
}: {
  installments: Installment[];
  projectId: string;
}) {
  const now = today();
  const overdue = installments.filter((i) => i.due_date && i.due_date < now);
  const in30 = installments.filter((i) => {
    if (!i.due_date || i.due_date < now) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    return i.due_date <= limit.toISOString().slice(0, 10);
  });

  if (overdue.length === 0 && in30.length === 0) return null;

  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recordatorio de pagos</CardTitle>
        <Link href={`/projects/${projectId}/finances`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Ver plan completo →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdue.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {overdue.length === 1 ? "1 cuota vencida" : `${overdue.length} cuotas vencidas`} —{" "}
                {formatCurrency(overdueTotal)}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {overdue.map((i) => (
                  <Badge key={i.id} variant="destructive" className="text-xs">
                    {i.label}: {formatCurrency(i.amount)}
                    {i.due_date && (
                      <span className="ml-1 opacity-80">
                        ({new Date(`${i.due_date}T00:00:00`).toLocaleDateString("es-MX")})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {in30.length > 0 && (
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {in30.length === 1 ? "1 pago próximo" : `${in30.length} pagos próximos`} (30 días)
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {in30.map((i) => (
                  <Badge key={i.id} variant="outline" className="text-xs">
                    {i.label}: {formatCurrency(i.amount)}
                    {i.due_date && (
                      <span className="ml-1 text-muted-foreground">
                        ({new Date(`${i.due_date}T00:00:00`).toLocaleDateString("es-MX")})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
