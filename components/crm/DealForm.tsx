"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dealSchema, type DealFormValues, type DealInput } from "@/lib/validations/deal";
import type { Profile } from "@/services/profiles.service";
import type { BusinessLine } from "@/services/business-lines.service";
import type { PipelineStage } from "@/services/pipeline-stages.service";
import type { ContactWithAccount } from "@/services/contacts.service";
import type { DealWithRelations } from "@/services/deals.service";

const PAYMENT_METHOD_OPTIONS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
] as const;

export function DealForm({
  deal,
  defaultAccountId,
  accounts,
  contacts,
  businessLines,
  owners,
  stages,
  canViewFinancials,
  initialEstimatedDirectCost,
  onSubmit,
}: {
  deal?: DealWithRelations;
  defaultAccountId?: string;
  accounts: { id: string; name: string }[];
  contacts: ContactWithAccount[];
  businessLines: BusinessLine[];
  owners: Profile[];
  stages: PipelineStage[];
  canViewFinancials: boolean;
  initialEstimatedDirectCost?: number | null;
  onSubmit: (input: DealInput) => Promise<{ id: string } | void>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues, unknown, DealInput>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: deal?.name ?? "",
      account_id: deal?.account_id ?? defaultAccountId ?? "",
      primary_contact_id: deal?.primary_contact_id ?? null,
      business_line_id: deal?.business_line_id ?? null,
      owner_id: deal?.owner_id ?? null,
      stage_id: deal?.stage_id ?? stages[0]?.id ?? "",
      probability: deal?.probability ?? null,
      expected_close_date: deal?.expected_close_date ?? "",
      price: deal?.price ?? 0,
      iva_rate: deal?.iva_rate ?? 0.16,
      payment_method: deal?.payment_method ?? null,
      deposit_percentage: deal?.deposit_percentage ?? null,
      monthly_support_amount: deal?.monthly_support_amount ?? null,
      observations: deal?.observations ?? "",
      estimated_direct_cost: initialEstimatedDirectCost ?? null,
    },
  });

  const selectedAccountId = watch("account_id");
  const accountContacts = contacts.filter((c) => c.account_id === selectedAccountId);

  async function submit(values: DealInput) {
    setServerError(null);
    try {
      const result = await onSubmit(values);
      router.push(result?.id ? `/crm/deals/${result.id}` : `/crm/deals/${deal?.id}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Cuenta *</Label>
          <Select value={watch("account_id")} onValueChange={(value) => setValue("account_id", value ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una cuenta">
                {(value: string | null) => accounts.find((acc) => acc.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Contacto principal</Label>
          <Select
            value={watch("primary_contact_id") ?? undefined}
            onValueChange={(value) => setValue("primary_contact_id", value)}
            disabled={accountContacts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un contacto">
                {(value: string | null) => accountContacts.find((contact) => contact.id === value)?.full_name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accountContacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Línea de negocio</Label>
          <Select
            value={watch("business_line_id") ?? undefined}
            onValueChange={(value) => setValue("business_line_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una línea">
                {(value: string | null) => businessLines.find((line) => line.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {businessLines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Responsable</Label>
          <Select value={watch("owner_id") ?? undefined} onValueChange={(value) => setValue("owner_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar">
                {(value: string | null) => owners.find((owner) => owner.id === value)?.full_name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Etapa *</Label>
          <Select value={watch("stage_id")} onValueChange={(value) => setValue("stage_id", value ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una etapa">
                {(value: string | null) => stages.find((stage) => stage.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="probability">Probabilidad (%)</Label>
          <Input id="probability" type="number" min={0} max={100} {...register("probability")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected_close_date">Fecha estimada de cierre</Label>
          <Input id="expected_close_date" type="date" {...register("expected_close_date")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio del proyecto (sin IVA) *</Label>
          <Input id="price" type="number" step="0.01" min={0} {...register("price")} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>

        {canViewFinancials && (
          <div className="space-y-2">
            <Label htmlFor="estimated_direct_cost">Costo directo estimado</Label>
            <Input id="estimated_direct_cost" type="number" step="0.01" min={0} {...register("estimated_direct_cost")} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Forma de pago</Label>
          <Select
            value={watch("payment_method") ?? undefined}
            onValueChange={(value) => setValue("payment_method", value as DealInput["payment_method"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una forma de pago">
                {(value: string | null) => PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === value)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deposit_percentage">Anticipo (%)</Label>
          <Input id="deposit_percentage" type="number" min={0} max={100} {...register("deposit_percentage")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_support_amount">Soporte mensual</Label>
          <Input id="monthly_support_amount" type="number" step="0.01" min={0} {...register("monthly_support_amount")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea id="observations" rows={3} {...register("observations")} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
