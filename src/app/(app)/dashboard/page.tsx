import { requireAuth } from "@/lib/auth-utils";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Car, Package, CreditCard } from "lucide-react";
import Link from "next/link";
import { StatutOR } from "@prisma/client";

const statutColors: Record<StatutOR, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  CLOTURE: "bg-green-100 text-green-800",
};

const statutLabels: Record<StatutOR, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  CLOTURE: "Cloture",
};

export default async function DashboardPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const stats = await getDashboardStats();

  const currentMonth = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {role === "CONTROLEUR" ? "Panneau de Commandes" : "Tableau de Bord"}
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vehicules au garage</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehiculesAuGarage}</div>
            <p className="text-xs text-muted-foreground">En attente de reparation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OR en cours</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordresEnCours}</div>
            <p className="text-xs text-muted-foreground">Reparations actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pieces en stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.piecesEnStock}</div>
            <p className="text-xs text-muted-foreground">References disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.revenusMois.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordres recents</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.ordresRecents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun ordre de reparation.</p>
          ) : (
            <div className="space-y-4">
              {stats.ordresRecents.map((or) => (
                <div
                  key={or.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/ordres/${or.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {or.numeroOR}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {or.vehicle.matricule} — {or.vehicle.client.nom}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={statutColors[or.statut]}
                    >
                      {statutLabels[or.statut]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(or.createdAt).toLocaleDateString("fr-FR")}
                    </span>
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
