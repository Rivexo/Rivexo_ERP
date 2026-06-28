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
import { accountSchema, type AccountInput } from "@/lib/validations/account";
import type { Profile } from "@/services/profiles.service";
import type { Account } from "@/services/accounts.service";

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospecto" },
  { value: "customer", label: "Cliente" },
  { value: "inactive", label: "Inactivo" },
] as const;

const COMPANY_SIZE_OPTIONS = [
  { value: "micro", label: "Micro" },
  { value: "small", label: "Pequeña" },
  { value: "medium", label: "Mediana" },
  { value: "large", label: "Grande" },
] as const;

export function AccountForm({
  account,
  owners,
  onSubmit,
}: {
  account?: Account;
  owners: Profile[];
  onSubmit: (input: AccountInput) => Promise<{ id: string } | void>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      legal_name: account?.legal_name ?? "",
      tax_id: account?.tax_id ?? "",
      industry: account?.industry ?? "",
      company_size: account?.company_size ?? null,
      address: account?.address ?? "",
      state: account?.state ?? "",
      country: account?.country ?? "",
      website: account?.website ?? "",
      lead_source: account?.lead_source ?? "",
      status: account?.status ?? "lead",
      owner_id: account?.owner_id ?? null,
      notes: account?.notes ?? "",
    },
  });

  async function submit(values: AccountInput) {
    setServerError(null);
    try {
      const result = await onSubmit(values);
      router.push(result?.id ? `/crm/accounts/${result.id}` : `/crm/accounts/${account?.id}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="legal_name">Razón social</Label>
          <Input id="legal_name" {...register("legal_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_id">RFC</Label>
          <Input id="tax_id" {...register("tax_id")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industria</Label>
          <Input id="industry" {...register("industry")} />
        </div>
        <div className="space-y-2">
          <Label>Tamaño</Label>
          <Select
            value={watch("company_size") ?? undefined}
            onValueChange={(value) => setValue("company_size", value as AccountInput["company_size"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tamaño">
                {(value: string | null) => COMPANY_SIZE_OPTIONS.find((opt) => opt.value === value)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estatus *</Label>
          <Select value={watch("status")} onValueChange={(value) => setValue("status", value as AccountInput["status"])}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estatus">
                {(value: string | null) => STATUS_OPTIONS.find((opt) => opt.value === value)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" {...register("address")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" {...register("state")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input id="country" {...register("country")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Sitio web</Label>
          <Input id="website" {...register("website")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead_source">Fuente del lead</Label>
          <Input id="lead_source" {...register("lead_source")} />
        </div>
        <div className="space-y-2">
          <Label>Responsable comercial</Label>
          <Select
            value={watch("owner_id") ?? undefined}
            onValueChange={(value) => setValue("owner_id", value)}
          >
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={4} {...register("notes")} />
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
