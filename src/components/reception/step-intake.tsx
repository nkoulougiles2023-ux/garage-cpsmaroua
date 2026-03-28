"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReceptionData } from "./reception-form";

type Intake = NonNullable<ReceptionData["intake"]>;

type Props = {
  initialData: Intake | null;
  onNext: (intake: Intake) => void;
  onBack: () => void;
};

export function StepIntake({ initialData, onNext, onBack }: Props) {
  const [form, setForm] = useState<Intake>(
    initialData ?? {
      chauffeurNom: "",
      chauffeurTel: "",
      serviceDorigine: "",
      kilometrage: 0,
      niveauCarburant: "",
      niveauUsurePneus: "",
      lotDeBord: "",
      prochaineVidange: "",
    }
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.chauffeurNom.trim()) errs.chauffeurNom = "Champ requis";
    if (!form.chauffeurTel.trim()) errs.chauffeurTel = "Champ requis";
    if (!form.niveauCarburant) errs.niveauCarburant = "Champ requis";
    if (!form.niveauUsurePneus) errs.niveauUsurePneus = "Champ requis";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (validate()) {
      onNext(form);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Étape 3 : Réception</h2>
        <p className="text-sm text-muted-foreground">
          Informations sur la prise en charge du véhicule.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Chauffeur nom */}
        <div className="space-y-1">
          <Label htmlFor="chauffeurNom">Nom du chauffeur *</Label>
          <Input
            id="chauffeurNom"
            value={form.chauffeurNom}
            onChange={(e) =>
              setForm((p) => ({ ...p, chauffeurNom: e.target.value }))
            }
          />
          {fieldErrors.chauffeurNom && (
            <p className="text-xs text-destructive">{fieldErrors.chauffeurNom}</p>
          )}
        </div>

        {/* Chauffeur tel */}
        <div className="space-y-1">
          <Label htmlFor="chauffeurTel">Téléphone chauffeur *</Label>
          <Input
            id="chauffeurTel"
            value={form.chauffeurTel}
            onChange={(e) =>
              setForm((p) => ({ ...p, chauffeurTel: e.target.value }))
            }
          />
          {fieldErrors.chauffeurTel && (
            <p className="text-xs text-destructive">{fieldErrors.chauffeurTel}</p>
          )}
        </div>

        {/* Service d'origine */}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="serviceDorigine">Service d&apos;origine</Label>
          <Input
            id="serviceDorigine"
            value={form.serviceDorigine}
            onChange={(e) =>
              setForm((p) => ({ ...p, serviceDorigine: e.target.value }))
            }
          />
        </div>

        {/* Kilométrage */}
        <div className="space-y-1">
          <Label htmlFor="kilometrage">Kilométrage *</Label>
          <Input
            id="kilometrage"
            type="number"
            min={0}
            value={form.kilometrage}
            onChange={(e) =>
              setForm((p) => ({ ...p, kilometrage: Number(e.target.value) }))
            }
          />
        </div>

        {/* Niveau carburant */}
        <div className="space-y-1">
          <Label htmlFor="niveauCarburant">Niveau carburant *</Label>
          <Select
            value={form.niveauCarburant}
            onValueChange={(value) =>
              setForm((p) => ({ ...p, niveauCarburant: value as string }))
            }
          >
            <SelectTrigger id="niveauCarburant" className="w-full">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIDE">Vide</SelectItem>
              <SelectItem value="1/4">1/4</SelectItem>
              <SelectItem value="1/2">1/2</SelectItem>
              <SelectItem value="3/4">3/4</SelectItem>
              <SelectItem value="PLEIN">Plein</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.niveauCarburant && (
            <p className="text-xs text-destructive">{fieldErrors.niveauCarburant}</p>
          )}
        </div>

        {/* Niveau usure pneus */}
        <div className="space-y-1">
          <Label htmlFor="niveauUsurePneus">Usure des pneus *</Label>
          <Select
            value={form.niveauUsurePneus}
            onValueChange={(value) =>
              setForm((p) => ({ ...p, niveauUsurePneus: value as string }))
            }
          >
            <SelectTrigger id="niveauUsurePneus" className="w-full">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BON">Bon</SelectItem>
              <SelectItem value="MOYEN">Moyen</SelectItem>
              <SelectItem value="USE">Usé</SelectItem>
              <SelectItem value="CRITIQUE">Critique</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.niveauUsurePneus && (
            <p className="text-xs text-destructive">{fieldErrors.niveauUsurePneus}</p>
          )}
        </div>

        {/* Lot de bord */}
        <div className="space-y-1">
          <Label htmlFor="lotDeBord">Lot de bord</Label>
          <Input
            id="lotDeBord"
            value={form.lotDeBord}
            onChange={(e) =>
              setForm((p) => ({ ...p, lotDeBord: e.target.value }))
            }
          />
        </div>

        {/* Prochaine vidange */}
        <div className="space-y-1">
          <Label htmlFor="prochaineVidange">Prochaine vidange</Label>
          <Input
            id="prochaineVidange"
            value={form.prochaineVidange}
            onChange={(e) =>
              setForm((p) => ({ ...p, prochaineVidange: e.target.value }))
            }
          />
        </div>
      </div>

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
