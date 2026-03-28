import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { getOrdreById } from "@/lib/actions/ordres";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrdreActions } from "@/components/ordres/ordre-actions";
import { StatutOR, StatutPanne } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

function statutORBadge(statut: StatutOR) {
  switch (statut) {
    case StatutOR.EN_ATTENTE:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          En attente
        </Badge>
      );
    case StatutOR.EN_COURS:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          En cours
        </Badge>
      );
    case StatutOR.CLOTURE:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Clôturé
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
}

function statutPanneBadge(statut: StatutPanne) {
  switch (statut) {
    case StatutPanne.SIGNALE:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Signalé
        </Badge>
      );
    case StatutPanne.EN_COURS:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          En cours
        </Badge>
      );
    case StatutPanne.RESOLU:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Résolu
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
}

export default async function OrdreDetailPage({ params }: Props) {
  await requireAuth();
  const { id } = await params;
  const ordre = await getOrdreById(id);

  if (!ordre) notFound();

  const vehicle = ordre.vehicle;
  const client = vehicle.client;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ordre.numeroOR}</h1>
          <p className="text-muted-foreground">
            {vehicle.marque} {vehicle.modele} — {vehicle.matricule}
          </p>
        </div>
        <div>{statutORBadge(ordre.statut)}</div>
      </div>

      <Separator />

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vehicle info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{client.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matricule</span>
              <span className="font-medium">{vehicle.matricule}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{vehicle.typeVehicule}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kilométrage</span>
              <span className="font-medium">{ordre.kilometrage} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carburant</span>
              <span className="font-medium">{ordre.niveauCarburant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pneus</span>
              <span className="font-medium">{ordre.niveauUsurePneus}</span>
            </div>
            {ordre.lotDeBord && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lot de bord</span>
                <span className="font-medium">{ordre.lotDeBord}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chauffeur info */}
        <Card>
          <CardHeader>
            <CardTitle>Chauffeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{ordre.chauffeurNom}</span>
            </div>
            {ordre.chauffeurTel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-medium">{ordre.chauffeurTel}</span>
              </div>
            )}
            {ordre.serviceDorigine && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{ordre.serviceDorigine}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date d&apos;entrée</span>
              <span className="font-medium">
                {new Date(ordre.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Signature</span>
              {ordre.signatureChauffeur ? (
                <img
                  src={ordre.signatureChauffeur}
                  alt="Signature du chauffeur"
                  className="h-12 border rounded bg-white"
                />
              ) : (
                <span className="text-muted-foreground italic">En attente</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pannes */}
      <Card>
        <CardHeader>
          <CardTitle>Pannes déclarées</CardTitle>
        </CardHeader>
        <CardContent>
          {ordre.pannes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune panne déclarée.</p>
          ) : (
            <ul className="space-y-2">
              {ordre.pannes.map((panne) => (
                <li
                  key={panne.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{panne.description}</span>
                  <div className="flex items-center gap-2">
                    {panne.section && (
                      <Badge variant="outline">{panne.section}</Badge>
                    )}
                    {statutPanneBadge(panne.statut)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <OrdreActions
        ordre={{ id: ordre.id, signatureChauffeur: ordre.signatureChauffeur }}
      />
    </div>
  );
}
