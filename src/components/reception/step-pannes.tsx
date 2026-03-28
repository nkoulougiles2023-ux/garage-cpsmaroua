"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { ReceptionData } from "./reception-form";

type Panne = { description: string };

type Props = {
  initialData: Panne[];
  onNext: (pannes: Panne[]) => void;
  onBack: () => void;
};

export function StepPannes({ initialData, onNext, onBack }: Props) {
  const [pannes, setPannes] = useState<Panne[]>(
    initialData.length > 0 ? initialData : [{ description: "" }]
  );
  const [error, setError] = useState("");

  function addPanne() {
    setPannes((p) => [...p, { description: "" }]);
  }

  function removePanne(index: number) {
    setPannes((p) => p.filter((_, i) => i !== index));
  }

  function updatePanne(index: number, value: string) {
    setPannes((p) =>
      p.map((panne, i) => (i === index ? { description: value } : panne))
    );
  }

  function handleSubmit() {
    const filtered = pannes.filter((p) => p.description.trim() !== "");
    if (filtered.length === 0) {
      setError("Veuillez saisir au moins une panne.");
      return;
    }
    setError("");
    onNext(filtered);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Étape 4 : Pannes signalées</h2>
        <p className="text-sm text-muted-foreground">
          Décrivez les pannes ou problèmes constatés.
        </p>
      </div>

      <div className="space-y-3">
        {pannes.map((panne, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`panne-${index}`}>Panne {index + 1}</Label>
              <Input
                id={`panne-${index}`}
                placeholder="Description de la panne..."
                value={panne.description}
                onChange={(e) => updatePanne(index, e.target.value)}
              />
            </div>
            {pannes.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-5 text-destructive hover:text-destructive"
                onClick={() => removePanne(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" variant="outline" onClick={addPanne}>
        + Ajouter une panne
      </Button>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
