import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const profileInfoSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido"),
  phone: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type ProfileInfoFormValues = z.input<typeof profileInfoSchema>;
export type ProfileInfoInput = z.output<typeof profileInfoSchema>;

export const emailChangeSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
});

export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

export const passwordChangeSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
