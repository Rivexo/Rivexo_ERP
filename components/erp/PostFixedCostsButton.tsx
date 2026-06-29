"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PostFixedCostsButton({ onPost }: { onPost: () => Promise<number> }) {
  const router = useRouter();
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsPosting(true);
    setMessage(null);
    try {
      const created = await onPost();
      setMessage(created > 0 ? `Se registraron ${created} costos fijos del mes.` : "Ya estaban registrados todos los costos fijos de este mes.");
      router.refresh();
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={isPosting} onClick={handleClick}>
        <ReceiptText className="size-4" /> {isPosting ? "Registrando..." : "Registrar costos del mes"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
