"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: (nextActive: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => onToggle(!isActive))}
    >
      {isActive ? "Desactivar" : "Activar"}
    </Button>
  );
}
