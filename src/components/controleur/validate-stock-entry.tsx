"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { validateStockEntry, rejectStockEntry } from "@/lib/actions/stock";
import { useRouter } from "next/navigation";

interface Props {
  mouvementId: string;
}

export function ValidateStockEntryButtons({ mouvementId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<"validate" | "reject" | null>(null);

  async function handleValidate() {
    setLoading("validate");
    await validateStockEntry(mouvementId);
    router.refresh();
  }

  async function handleReject() {
    setLoading("reject");
    await rejectStockEntry(mouvementId);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="default"
        onClick={handleValidate}
        disabled={loading !== null}
        className="h-7 px-2 text-xs"
      >
        <Check className="mr-1 h-3 w-3" />
        {loading === "validate" ? "..." : "Valider"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={loading !== null}
        className="h-7 px-2 text-xs"
      >
        <X className="mr-1 h-3 w-3" />
        {loading === "reject" ? "..." : "Rejeter"}
      </Button>
    </div>
  );
}
