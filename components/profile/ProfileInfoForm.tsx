"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileInfoSchema, type ProfileInfoFormValues, type ProfileInfoInput } from "@/lib/validations/profile";
import type { Profile } from "@/services/profiles.service";

export function ProfileInfoForm({
  profile,
  onSubmit,
}: {
  profile: Profile;
  onSubmit: (input: ProfileInfoInput) => Promise<void>;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInfoFormValues, unknown, ProfileInfoInput>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: { full_name: profile.full_name, phone: profile.phone ?? "" },
  });

  async function submit(values: ProfileInfoInput) {
    await onSubmit(values);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre completo *</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" type="tel" {...register("phone")} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
