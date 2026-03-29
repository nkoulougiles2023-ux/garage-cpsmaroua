"use client";

import * as React from "react";
import { Section } from "@prisma/client";
import { assignPanne } from "@/lib/actions/pannes";
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

const SECTIONS: { label: string; value: Section }[] = [
  { label: "Tôlerie", value: "TOLERIE" },
  { label: "Soudure", value: "SOUDURE" },
  { label: "Électricité", value: "ELECTRICITE" },
  { label: "Poids Lourds", value: "POIDS_LOURDS" },
  { label: "Poids Légers", value: "POIDS_LEGERS" },
];

interface AssignPanneDialogProps {
  panneId: string;
}

export function AssignPanneDialog({ panneId }: AssignPanneDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [section, setSection] = React.useState<Section | "">("");
  const [mecanicien, setMecanicien] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleAssign() {
    if (!section || !mecanicien.trim()) return;
    setLoading(true);
    try {
      await assignPanne(panneId, section as Section, mecanicien.trim());
      setOpen(false);
      setSection("");
      setMecanicien("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Assigner
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner la panne</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section">Section</Label>
            <Select
              value={section}
              onValueChange={(value) => setSection(value as Section)}
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
            <Label htmlFor="mecanicien">Mécanicien</Label>
            <Input
              id="mecanicien"
              placeholder="Nom du mécanicien"
              value={mecanicien}
              onChange={(e) => setMecanicien(e.target.value)}
            />
          </div>
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
            onClick={handleAssign}
            disabled={!section || !mecanicien.trim() || loading}
          >
            {loading ? "En cours..." : "Assigner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
