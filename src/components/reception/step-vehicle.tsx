"use client";

import { useState, useTransition, useEffect } from "react";
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
import { getVehiclesByClient, createVehicle } from "@/lib/actions/vehicles";
import type { ReceptionData } from "./reception-form";

type Client = NonNullable<ReceptionData["client"]>;
type Vehicle = NonNullable<ReceptionData["vehicle"]>;

type Props = {
  client: Client;
  initialData: Vehicle | null;
  onNext: (vehicle: Vehicle) => void;
  onBack: () => void;
};

type VehicleRecord = {
  id: string;
  matricule: string;
  marque: string;
  modele: string;
  typeVehicule: string;
  numeroChassis?: string | null;
};

export function StepVehicle({ client, initialData, onNext, onBack }: Props) {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    matricule: "",
    typeVehicule: "VOITURE",
    marque: "",
    modele: "",
    numeroChassis: "",
  });

  useEffect(() => {
    if (client.id) {
      startTransition(async () => {
        const result = await getVehiclesByClient(client.id!);
        setVehicles(result as VehicleRecord[]);
      });
    }
  }, [client.id]);

  function handleSelectVehicle(v: VehicleRecord) {
    onNext({
      id: v.id,
      matricule: v.matricule,
      marque: v.marque,
      modele: v.modele,
      typeVehicule: v.typeVehicule,
      numeroChassis: v.numeroChassis ?? undefined,
    });
  }

  function handleCreate() {
    setErrors({});
    startTransition(async () => {
      const result = await createVehicle({
        ...form,
        clientId: client.id,
      });
      if (result.error) {
        setErrors(result.error as Record<string, string[]>);
        return;
      }
      const v = result.data!;
      onNext({
        id: v.id,
        matricule: v.matricule,
        marque: v.marque,
        modele: v.modele,
        typeVehicule: v.typeVehicule,
        numeroChassis: v.numeroChassis ?? undefined,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Étape 2 : Véhicule</h2>
        <p className="text-sm text-muted-foreground">
          Client : <span className="font-medium">{client.prenom} {client.nom}</span>
        </p>
      </div>

      {/* Existing vehicles */}
      {vehicles.length > 0 && (
        <div className="space-y-2">
          <Label>Véhicules existants</Label>
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleSelectVehicle(v)}
            >
              <div>
                <p className="font-medium">{v.matricule}</p>
                <p className="text-sm text-muted-foreground">
                  {v.marque} {v.modele} — {v.typeVehicule}
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary">
                Sélectionner
              </Button>
            </div>
          ))}
        </div>
      )}

      {vehicles.length === 0 && !isPending && (
        <p className="text-sm text-muted-foreground">
          Aucun véhicule enregistré pour ce client.
        </p>
      )}

      {/* New vehicle */}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Annuler" : "+ Nouveau véhicule"}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Nouveau véhicule</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="matricule">Matricule *</Label>
              <Input
                id="matricule"
                value={form.matricule}
                onChange={(e) =>
                  setForm((p) => ({ ...p, matricule: e.target.value }))
                }
              />
              {errors.matricule && (
                <p className="text-xs text-destructive">{errors.matricule[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="typeVehicule">Type *</Label>
              <Select
                value={form.typeVehicule}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, typeVehicule: value as string }))
                }
              >
                <SelectTrigger id="typeVehicule" className="w-full">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VOITURE">Voiture</SelectItem>
                  <SelectItem value="CAMION">Camion</SelectItem>
                  <SelectItem value="BUS">Bus</SelectItem>
                </SelectContent>
              </Select>
              {errors.typeVehicule && (
                <p className="text-xs text-destructive">
                  {errors.typeVehicule[0]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="marque">Marque *</Label>
              <Input
                id="marque"
                value={form.marque}
                onChange={(e) =>
                  setForm((p) => ({ ...p, marque: e.target.value }))
                }
              />
              {errors.marque && (
                <p className="text-xs text-destructive">{errors.marque[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="modele">Modèle *</Label>
              <Input
                id="modele"
                value={form.modele}
                onChange={(e) =>
                  setForm((p) => ({ ...p, modele: e.target.value }))
                }
              />
              {errors.modele && (
                <p className="text-xs text-destructive">{errors.modele[0]}</p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="numeroChassis">Numéro de châssis</Label>
              <Input
                id="numeroChassis"
                value={form.numeroChassis}
                onChange={(e) =>
                  setForm((p) => ({ ...p, numeroChassis: e.target.value }))
                }
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Création..." : "Créer et continuer"}
          </Button>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>
    </div>
  );
}
