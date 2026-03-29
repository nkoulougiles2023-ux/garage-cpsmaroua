import { requireRole } from "@/lib/auth-utils";
import { getMyReparations } from "@/lib/actions/client-portal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Wrench, AlertTriangle } from "lucide-react";
import { StatutOR, StatutPanne } from "@prisma/client";

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
        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
          Signalé
        </Badge>
      );
    case StatutPanne.EN_COURS:
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-300">
          En cours
        </Badge>
      );
    case StatutPanne.RESOLU:
      return (
        <Badge variant="outline" className="text-green-700 border-green-300">
          Résolu
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
}

export default async function MesReparationsPage() {
  await requireRole(["CLIENT"]);
  const reparations = await getMyReparations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes réparations</h1>

      {reparations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Aucune réparation en cours.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reparations.map((or) => (
            <Card key={or.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {or.numeroOR}
                  </CardTitle>
                  {statutORBadge(or.statut)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {or.vehicle.marque} {or.vehicle.modele} — {or.vehicle.matricule}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>
                    Entrée : {new Date(or.dateEntree).toLocaleDateString("fr-FR")}
                  </span>
                  {or.dateSortie && (
                    <span>
                      Sortie : {new Date(or.dateSortie).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {or.pannes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Pannes signalées
                    </p>
                    <ul className="space-y-1">
                      {or.pannes.map((panne) => (
                        <li
                          key={panne.id}
                          className="flex items-center justify-between text-sm rounded-md bg-muted/50 px-3 py-1.5"
                        >
                          <span>{panne.description}</span>
                          {statutPanneBadge(panne.statut)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-4 text-sm text-muted-foreground pt-1">
                  <span>{or.interventions.length} intervention(s)</span>
                  <span>{or._count.picklists} picklist(s)</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
