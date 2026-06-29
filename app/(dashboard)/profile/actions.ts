"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  emailChangeSchema,
  passwordChangeSchema,
  profileInfoSchema,
  type EmailChangeInput,
  type PasswordChangeInput,
  type ProfileInfoInput,
} from "@/lib/validations/profile";
import { updateAvatar, updateProfileInfo } from "@/services/profiles.service";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("No autenticado");
  return data.user.id;
}

export async function updateProfileInfoAction(input: ProfileInfoInput): Promise<void> {
  const parsed = profileInfoSchema.parse(input);
  const userId = await requireUserId();
  await updateProfileInfo(userId, parsed);
  revalidatePath("/", "layout");
}

export async function updateAvatarAction(formData: FormData): Promise<void> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecciona una imagen");
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes");

  const userId = await requireUserId();
  await updateAvatar(userId, file);
  revalidatePath("/", "layout");
}

export async function updateEmailAction(input: EmailChangeInput): Promise<void> {
  const parsed = emailChangeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.email });
  if (error) throw new Error(error.message);
}

export async function updatePasswordAction(input: PasswordChangeInput): Promise<void> {
  const parsed = passwordChangeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.password });
  if (error) throw new Error(error.message);
}
