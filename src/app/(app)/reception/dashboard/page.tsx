import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getReceptionnisteDashboardStats } from "@/lib/actions/dashboard-receptionniste";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  Clock,
  CheckCircle,
  Wrench,
  PlusCircle,
  Users,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
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

export default async function ReceptionDashboardPage() {
  await requireRole(["ADMIN", "RECEPTIONNISTE"]);
  const stats = await getReceptionnisteDashboardStats();

  const currentMonth = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord — Reception</h1>
        <Button render={<Link href="/reception/nouveau" />}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle reception
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vehicules recus ce mois
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.vehiculesRecusCeMois}
            </div>
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              OR en attente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.ordresEnAttente}
            </div>
            <p className="text-xs text-muted-foreground">
              a traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              OR en cours
            </CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.ordresEnCours}
            </div>
            <p className="text-xs text-muted-foreground">
              en reparation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Clotures ce mois
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.ordresClotureCeMois}
            </div>
            <p className="text-xs text-muted-foreground">
              reparations terminees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Recus aujourd&apos;hui
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.vehiculesRecusAujourdhui}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Picklists en attente
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.picklistsEnAttente}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Derniers ordres de reparation</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/ordres" />}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentOrdres.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun ordre de reparation.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrdres.map((or) => (
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
                      {or.vehicle.matricule} — {or.vehicle.marque}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client: {or.vehicle.client.nom}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statutColors[or.statut]}>
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
