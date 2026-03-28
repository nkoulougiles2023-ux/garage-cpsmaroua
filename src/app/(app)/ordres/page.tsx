import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getOrdres } from "@/lib/actions/ordres";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList } from "lucide-react";
import { StatutOR } from "@prisma/client";

function statutBadge(statut: StatutOR) {
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

export default async function OrdresPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const ordres = await getOrdres();

  const canCreate = role === "ADMIN" || role === "RECEPTIONNISTE";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordres de réparation</h1>
        {canCreate && (
          <Button render={<Link href="/reception/nouveau" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle réception
          </Button>
        )}
      </div>

      {ordres.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Aucun ordre de réparation
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ordres.map((or) => (
            <Link key={or.id} href={`/ordres/${or.id}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{or.numeroOR}</span>
                      {statutBadge(or.statut)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {or.vehicle.marque} {or.vehicle.modele} — {or.vehicle.matricule}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Client : {or.vehicle.client.nom}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground space-y-1">
                    <p>{new Date(or.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p>
                      {or._count.interventions} intervention(s) ·{" "}
                      {or._count.picklists} picklist(s)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
