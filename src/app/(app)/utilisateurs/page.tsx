import { requireRole } from "@/lib/auth-utils";
import { getUsers } from "@/lib/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { ToggleUserButton } from "./toggle-user-button";

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RECEPTIONNISTE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MAGASINIER: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CONTROLEUR: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLIENT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RECEPTIONNISTE: "Receptionniste",
  MAGASINIER: "Magasinier",
  CONTROLEUR: "Controleur",
  CLIENT: "Client",
};

export default async function UtilisateursPage() {
  await requireRole(["ADMIN"]);
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
        <UserFormDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className={!user.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {user.prenom} {user.nom}
                </CardTitle>
                <Badge className={roleColors[user.role]}>
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.telephone && (
                <p className="text-sm text-muted-foreground">{user.telephone}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Actif" : "Inactif"}
                </Badge>
                <ToggleUserButton userId={user.id} isActive={user.isActive} />
              </div>
              <p className="text-xs text-muted-foreground">
                Cree le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun utilisateur.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
