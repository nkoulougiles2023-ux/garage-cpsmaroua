"use client";

import * as React from "react";
import { Section } from "@prisma/client";
import { createIntervention } from "@/lib/actions/interventions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const SECTIONS: { label: string; value: Section }[] = [
  { label: "Tolerie", value: "TOLERIE" },
  { label: "Soudure", value: "SOUDURE" },
  { label: "Electricite", value: "ELECTRICITE" },
  { label: "Poids Lourds", value: "POIDS_LOURDS" },
  { label: "Poids Legers", value: "POIDS_LEGERS" },
];

interface CreateInterventionDialogProps {
  ordreReparationId: string;
}

export function CreateInterventionDialog({
  ordreReparationId,
}: CreateInterventionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [section, setSection] = React.useState<Section | "">("");
  const [mecanicienNom, setMecanicienNom] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleCreate() {
    if (!section || !mecanicienNom.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await createIntervention({
        ordreReparationId,
        mecanicienNom: mecanicienNom.trim(),
        section: section as Section,
        description: description.trim(),
      });
      setOpen(false);
      setSection("");
      setMecanicienNom("");
      setDescription("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-2 h-4 w-4" />
        Nouvelle intervention
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle intervention</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mecanicienNom">Mecanicien</Label>
            <Input
              id="mecanicienNom"
              placeholder="Nom du mecanicien"
              value={mecanicienNom}
              onChange={(e) => setMecanicienNom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section">Section</Label>
            <Select
              value={section}
              onValueChange={(value) => setSection((value ?? "") as Section | "")}
            >
              <SelectTrigger id="section" className="w-full">
                <SelectValue placeholder="Choisir une section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Description de l'intervention"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Taux horaire main d&apos;œuvre : 10 000 FCFA (fixe)
          </p>
        </div>
        <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !section ||
              !mecanicienNom.trim() ||
              !description.trim() ||
              loading
            }
          >
            {loading ? "En cours..." : "Creer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
