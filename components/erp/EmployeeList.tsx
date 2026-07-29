"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { Employee } from "@/services/employees.service";

export function EmployeeList({
  employees,
  onCreate,
  onToggleActive,
  onAccruePayroll,
}: {
  employees: Employee[];
  onCreate: (input: { full_name: string; monthly_salary: number }) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onAccruePayroll: () => Promise<number>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccruing, setIsAccruing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setIsSubmitting(true);
    try {
      await onCreate({
        full_name: String(fd.get("full_name") || ""),
        monthly_salary: Number(fd.get("monthly_salary")),
      });
      formRef.current?.reset();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccrue() {
    setIsAccruing(true);
    setMessage(null);
    try {
      const created = await onAccruePayroll();
      setMessage(created > 0 ? `Se devengó la nómina de ${created} empleado(s).` : "La nómina de este mes ya estaba devengada.");
      router.refresh();
    } finally {
      setIsAccruing(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Arquitectura lista para personal fijo: el sueldo se prorratea entre proyectos según el
        tiempo asignado (<code>time_allocations</code>) y el devengo mensual se refleja como pasivo
        (2300 Nómina por Pagar) en el balance general.
      </p>

      <form ref={formRef} onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="full_name">Nombre</Label>
          <Input id="full_name" name="full_name" required className="w-48" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="monthly_salary">Sueldo mensual</Label>
          <Input id="monthly_salary" name="monthly_salary" type="number" step="0.01" min={0} required className="w-40" />
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          <Plus className="size-4" /> {isSubmitting ? "Guardando..." : "Agregar empleado"}
        </Button>
      </form>

      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin empleados registrados.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Sueldo mensual</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(emp.monthly_salary)}</TableCell>
                  <TableCell>
                    <Badge variant={emp.active ? "secondary" : "outline"}>
                      {emp.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(emp.id, !emp.active).then(() => router.refresh())}
                    >
                      {emp.active ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={isAccruing} onClick={handleAccrue}>
              {isAccruing ? "Devengando..." : "Devengar nómina del mes"}
            </Button>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
