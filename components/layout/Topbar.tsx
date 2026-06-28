import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { roleLabel } from "@/lib/permissions";
import type { Profile } from "@/services/profiles.service";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{roleLabel(profile.role)}</Badge>
        <Avatar className="size-8">
          <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{profile.full_name}</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
