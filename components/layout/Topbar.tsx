import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <SidebarTrigger />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 outline-hidden hover:bg-accent">
              <Avatar className="size-8">
                <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{profile.full_name}</span>
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{profile.full_name}</p>
            <p className="text-xs font-normal text-muted-foreground">{profile.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <Badge variant="secondary">{roleLabel(profile.role)}</Badge>
          </div>
          <DropdownMenuSeparator />
          <form action={signOut}>
            <DropdownMenuItem render={<button type="submit" className="w-full" />}>
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
