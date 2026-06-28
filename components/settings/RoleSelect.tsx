"use client";

import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roleLabel, type UserRole } from "@/lib/permissions";
import { updateProfileRoleAction } from "@/app/(dashboard)/settings/users/actions";

const ROLES: UserRole[] = ["founder", "partner", "project_manager", "sales", "operations", "finance"];

export function RoleSelect({ profileId, currentRole }: { profileId: string; currentRole: UserRole }) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={role}
      disabled={isPending}
      onValueChange={(value) => {
        if (!value) return;
        const next = value as UserRole;
        setRole(next);
        startTransition(() => updateProfileRoleAction(profileId, next));
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue>{(value: UserRole | null) => (value ? roleLabel(value) : null)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {roleLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
