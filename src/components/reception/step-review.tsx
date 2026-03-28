"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createOrdreReparation } from "@/lib/actions/ordres";
import type { ReceptionData } from "./reception-form";

type Props = {
  data: ReceptionData;
  onBack: () => void;
};

export function StepReview({ data, onBack }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { client, vehicle, intake, pannes } = data;

  function handleCreate() {
    if (!vehicle?.id || !intake) return;

    setError(null);
    startTransition(async () => {
      const result = await createOrdreReparation({
        vehicleId: vehicle.id,
        chauffeurNom: intake.chauffeurNom,
        chauffeurTel: intake.chauffeurTel,
        serviceDorigine: intake.serviceDorigine || undefined,
        kilometrage: intake.kilometrage,
        niveauCarburant: intake.niveauCarburant,
        niveauUsurePneus: intake.niveauUsurePneus,
        lotDeBord: intake.lotDeBord || undefined,
        prochaineVidange: intake.prochaineVidange || undefined,
        pannes,
      });

      if (result.error) {
        if (typeof result.error === "string") {
          setError(result.error);
        } else {
          setError("Erreur lors de la création. Vérifiez les données.");
        }
        return;
      }

      router.push(`/ordres/${result.data!.id}`);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Étape 5 : Résumé</h2>
        <p className="text-sm text-muted-foreground">
          Vérifiez les informations avant de créer l&apos;ordre de réparation.
        </p>
      </div>

      {/* Client */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Client
        </h3>
        {client ? (
          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p className="font-medium">
              {client.prenom} {client.nom}
            </p>
            <p className="text-muted-foreground">{client.telephone}</p>
            {client.email && <p className="text-muted-foreground">{client.email}</p>}
            {client.adresse && <p className="text-muted-foreground">{client.adresse}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun client sélectionné.</p>
        )}
      </div>

      <Separator />

      {/* Vehicle */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Véhicule
        </h3>
        {vehicle ? (
          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p className="font-medium">{vehicle.matricule}</p>
            <p className="text-muted-foreground">
              {vehicle.marque} {vehicle.modele} — {vehicle.typeVehicule}
            </p>
            {vehicle.numeroChassis && (
              <p className="text-muted-foreground">
                Châssis : {vehicle.numeroChassis}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun véhicule sélectionné.</p>
        )}
      </div>

      <Separator />

      {/* Intake */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Réception
        </h3>
        {intake ? (
          <div className="rounded-lg border p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-muted-foreground">Chauffeur : </span>
              <span>{intake.chauffeurNom}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tél. : </span>
              <span>{intake.chauffeurTel}</span>
            </div>
            {intake.serviceDorigine && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Service : </span>
                <span>{intake.serviceDorigine}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Kilométrage : </span>
              <span>{intake.kilometrage} km</span>
            </div>
            <div>
              <span className="text-muted-foreground">Carburant : </span>
              <span>{intake.niveauCarburant}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pneus : </span>
              <span>{intake.niveauUsurePneus}</span>
            </div>
            {intake.lotDeBord && (
              <div>
                <span className="text-muted-foreground">Lot de bord : </span>
                <span>{intake.lotDeBord}</span>
              </div>
            )}
            {intake.prochaineVidange && (
              <div>
                <span className="text-muted-foreground">Prochaine vidange : </span>
                <span>{intake.prochaineVidange}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune donnée de réception.</p>
        )}
      </div>

      <Separator />

      {/* Pannes */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Pannes signalées ({pannes.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {pannes.map((panne, i) => (
            <Badge key={i} variant="secondary">
              {panne.description}
            </Badge>
          ))}
          {pannes.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune panne.</p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          Retour
        </Button>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !vehicle?.id}
        >
          {isPending ? "Création en cours..." : "Créer l'Ordre de Réparation"}
        </Button>
      </div>
    </div>
  );
}
