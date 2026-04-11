import { requireRole } from "@/lib/auth-utils";
import {
  getControleurStats,
  getOrdresByStatut,
  getPicklistsToSign,
  getPendingStockEntries,
} from "@/lib/queries/controleur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  Clock,
  CheckCircle,
  Pause,
  Package,
} from "lucide-react";
import { SignPicklistButton } from "@/components/controleur/sign-picklist-button";
import { ValidateStockEntryButtons } from "@/components/controleur/validate-stock-entry";

export default async function ControleurPage() {
  await requireRole(["ADMIN", "CONTROLEUR"]);

  const [stats, ordres, picklists, pendingEntries] = await Promise.all([
    getControleurStats(),
    getOrdresByStatut(),
    getPicklistsToSign(),
    getPendingStockEntries(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panneau de Commandes</h1>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pannes non assignees
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pannesNonAssignees}
            </div>
            <p className="text-xs text-muted-foreground">
              En attente d&apos;assignation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Interventions en cours
            </CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.interventionsEnCours}
            </div>
            <p className="text-xs text-muted-foreground">Travaux actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Picklists a signer
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.picklistsEnAttente}
            </div>
            <p className="text-xs text-muted-foreground">
              En attente de signature
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Interventions terminees
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.interventionsTermineeCeMois}
            </div>
            <p className="text-xs text-muted-foreground">ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Picklists signees
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.picklistsSigneesCeMois}
            </div>
            <p className="text-xs text-muted-foreground">total signees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Entrées stock
            </CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.entreesEnAttente}
            </div>
            <p className="text-xs text-muted-foreground">à valider</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Stock Entries */}
      {pendingEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <CardTitle>Entrées de stock en attente de validation ({pendingEntries.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingEntries.map((entry: { id: string; quantite: number; date: Date; motif: string | null; piece: { codeBarre: string; designation: string }; effectuePar: { nom: string; prenom: string } }) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {entry.piece.designation}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code: {entry.piece.codeBarre} — Quantité: <span className="font-semibold text-foreground">{entry.quantite}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Par: {entry.effectuePar.prenom} {entry.effectuePar.nom} — {new Date(entry.date).toLocaleDateString("fr-FR")}
                    </p>
                    {entry.motif && (
                      <p className="text-xs text-muted-foreground">
                        Motif: {entry.motif}
                      </p>
                    )}
                  </div>
                  <ValidateStockEntryButtons mouvementId={entry.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Picklists to sign */}
      {picklists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Picklists en attente de signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {picklists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{pl.numeroPicklist}</p>
                    <p className="text-xs text-muted-foreground">
                      OR: {pl.ordreReparation.numeroOR} — Mecanicien:{" "}
                      {pl.mecanicienNom}
                    </p>
                    <p className="text-xs font-semibold">
                      {pl.montantTotal.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                  <SignPicklistButton picklistId={pl.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OR Status Columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* En Attente */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Pause className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-base">
              En Attente ({ordres.enAttente.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ordres.enAttente.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun OR.</p>
              ) : (
                ordres.enAttente.map((or) => (
                  <ORCard key={or.id} or={or} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* En Cours */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Clock className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base">
              En Cours ({ordres.enCours.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ordres.enCours.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun OR.</p>
              ) : (
                ordres.enCours.map((or) => (
                  <ORCard key={or.id} or={or} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cloture */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <CardTitle className="text-base">
              Cloture ({ordres.cloture.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ordres.cloture.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun OR.</p>
              ) : (
                ordres.cloture.map((or) => (
                  <ORCard key={or.id} or={or} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ORCard({
  or,
}: {
  or: {
    id: string;
    numeroOR: string;
    createdAt: Date;
    vehicle: {
      matricule: string;
      marque: string;
      client: { nom: string };
    };
    _count: { pannes: number; interventions: number; picklists: number };
  };
}) {
  return (
    <Link href={`/ordres/${or.id}`} className="block">
      <div className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{or.numeroOR}</p>
          <span className="text-xs text-muted-foreground">
            {new Date(or.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {or.vehicle.matricule} — {or.vehicle.marque}
        </p>
        <p className="text-xs text-muted-foreground">
          Client: {or.vehicle.client.nom}
        </p>
        <div className="mt-1 flex gap-2">
          <Badge variant="outline" className="text-xs">
            {or._count.pannes} panne{or._count.pannes !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {or._count.interventions} interv.
          </Badge>
          <Badge variant="outline" className="text-xs">
            {or._count.picklists} picklist{or._count.picklists !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
