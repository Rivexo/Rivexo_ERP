import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm";
import { EmailForm } from "@/components/profile/EmailForm";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { roleLabel } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { updateAvatarAction, updateEmailAction, updatePasswordAction, updateProfileInfoAction } from "./actions";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Mi perfil" description="Información personal y seguridad de tu cuenta" />

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploader fullName={profile.full_name} avatarUrl={profile.avatar_url} onUpload={updateAvatarAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="secondary">{roleLabel(profile.role)}</Badge>
          <ProfileInfoForm profile={profile} onSubmit={updateProfileInfoAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correo electrónico</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailForm currentEmail={profile.email} onSubmit={updateEmailAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm onSubmit={updatePasswordAction} />
        </CardContent>
      </Card>
    </div>
  );
}
