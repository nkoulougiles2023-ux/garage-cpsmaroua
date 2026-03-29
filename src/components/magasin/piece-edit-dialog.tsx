"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updatePiece } from "@/lib/actions/pieces";
import { Pencil } from "lucide-react";

interface PieceData {
  id: string;
  codeBarre: string;
  designation: string;
  categorie: string | null;
  prixUnitaire: number;
  seuilAlerte: number;
  emplacement: string | null;
}

export function PieceEditDialog({ piece }: { piece: PieceData }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const data = {
      designation: fd.get("designation") as string,
      categorie: (fd.get("categorie") as string) || undefined,
      prixUnitaire: Number(fd.get("prixUnitaire")),
      seuilAlerte: Number(fd.get("seuilAlerte")),
      emplacement: (fd.get("emplacement") as string) || undefined,
    };
    const result = await updatePiece(piece.id, data);
    setLoading(false);
    if ("error" in result) {
      setError("Erreur lors de la modification");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier — {piece.codeBarre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Input
              name="designation"
              defaultValue={piece.designation}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categorie</Label>
            <Input name="categorie" defaultValue={piece.categorie ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prix unitaire (FCFA)</Label>
              <Input
                name="prixUnitaire"
                type="number"
                min={0}
                defaultValue={piece.prixUnitaire}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Seuil d&apos;alerte</Label>
              <Input
                name="seuilAlerte"
                type="number"
                min={0}
                defaultValue={piece.seuilAlerte}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Emplacement</Label>
            <Input
              name="emplacement"
              defaultValue={piece.emplacement ?? ""}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
