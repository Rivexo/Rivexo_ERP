"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailChangeSchema, type EmailChangeInput } from "@/lib/validations/profile";

export function EmailForm({
  currentEmail,
  onSubmit,
}: {
  currentEmail: string;
  onSubmit: (input: EmailChangeInput) => Promise<void>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailChangeInput>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: { email: "" },
  });

  async function submit(values: EmailChangeInput) {
    setMessage(null);
    setError(null);
    try {
      await onSubmit(values);
      setMessage(`Te enviamos un correo de confirmación a ${values.email}. El cambio se aplica cuando das clic en el enlace.`);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Correo actual</Label>
        <p className="text-sm text-muted-foreground">{currentEmail}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Nuevo correo</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Cambiar correo"}
      </Button>
    </form>
  );
}
