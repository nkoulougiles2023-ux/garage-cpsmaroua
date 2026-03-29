"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransition } from "react";

export function MouvementFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleTypeChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    startTransition(() => {
      router.replace(`/magasin/mouvements?${params.toString()}`);
    });
  }

  return (
    <div className="flex gap-3">
      <Select
        defaultValue={searchParams.get("type") ?? "ALL"}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous les types</SelectItem>
          <SelectItem value="ENTREE">Entrees</SelectItem>
          <SelectItem value="SORTIE">Sorties</SelectItem>
        </SelectContent>
      </Select>
      {isPending && (
        <span className="text-xs text-muted-foreground self-center">...</span>
      )}
    </div>
  );
}
