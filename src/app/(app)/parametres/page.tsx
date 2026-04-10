import { requireRole } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default async function ParametresPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les paramètres du système seront disponibles prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
