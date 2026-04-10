import { requireRole } from "@/lib/auth-utils";
import { getReportStats } from "@/lib/actions/rapports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Car,
  ClipboardList,
  CreditCard,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function RapportsPage() {
  await requireRole(["ADMIN"]);
  const stats = await getReportStats();

  const currentMonth = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapports</h1>
      <p className="text-sm text-muted-foreground">
        Statistiques générales — {currentMonth}
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total véhicules</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicules}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total ordres</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrdres}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ordresEnCours} en cours · {stats.ordresClotures} clôturés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.revenusMois.toLocaleString("fr-FR")} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.revenusTotal.toLocaleString("fr-FR")} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pièces en stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.piecesEnStock}</div>
            <p className="text-xs text-muted-foreground">
              {stats.piecesStockBas} en alerte stock bas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Picklists en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.picklistsEnAttente}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordres récents clôturés</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.ordresRecentsClotures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun ordre clôturé récemment.</p>
          ) : (
            <div className="space-y-3">
              {stats.ordresRecentsClotures.map((or) => (
                <div
                  key={or.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-medium">{or.numeroOR}</span>
                    <p className="text-xs text-muted-foreground">
                      {or.vehicle.matricule} — {or.vehicle.marque} {or.vehicle.modele}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      Entrée: {new Date(or.dateEntree).toLocaleDateString("fr-FR")}
                    </p>
                    {or.dateSortie && (
                      <p>
                        Sortie: {new Date(or.dateSortie).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
