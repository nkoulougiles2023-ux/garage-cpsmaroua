import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getMagasinierDashboardStats } from "@/lib/actions/dashboard-magasinier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Layers,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  ClipboardList,
  XCircle,
} from "lucide-react";

export default async function MagasinierDashboardPage() {
  await requireRole(["ADMIN", "MAGASINIER"]);
  const stats = await getMagasinierDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord — Magasin</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total references
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferences}</div>
            <p className="text-xs text-muted-foreground">
              pieces dans le catalogue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total unites en stock
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnites}</div>
            <p className="text-xs text-muted-foreground">
              unites disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En rupture</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.piecesEnRupture}
            </div>
            <p className="text-xs text-muted-foreground">
              stock a zero
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock bas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.piecesStockBas}
            </div>
            <p className="text-xs text-muted-foreground">
              sous le seuil d&apos;alerte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Mouvements aujourd&apos;hui
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mouvementsAujourdhui}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Mouvements ce mois
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mouvementsCeMois}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Picklists a livrer
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.picklistsALivrer}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Movements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Derniers mouvements</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/magasin/mouvements" />}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentMouvements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun mouvement recemment.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentMouvements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      {m.type === "ENTREE" ? (
                        <ArrowDownCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {m.piece.designation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.effectuePar.prenom} {m.effectuePar.nom}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={m.type === "ENTREE" ? "default" : "destructive"}
                    >
                      {m.type === "ENTREE" ? `+${m.quantite}` : `-${m.quantite}`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alertes stock
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/magasin/alertes" />}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {stats.topAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune alerte. Tous les stocks sont bons.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.topAlerts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.designation}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.codeBarre}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {p.quantiteEnStock === 0
                          ? "Rupture"
                          : `${p.quantiteEnStock}/${p.seuilAlerte}`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
