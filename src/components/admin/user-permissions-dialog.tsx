"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateUserPermissions } from "@/lib/actions/permissions";
import { Shield } from "lucide-react";

interface PermissionDef {
  label: string;
  default: boolean;
}

interface Props {
  userId: string;
  userName: string;
  role: string;
  permissionDefs: Record<string, PermissionDef>;
  currentPermissions: Record<string, boolean>;
}

export function UserPermissionsDialog({
  userId,
  userName,
  role,
  permissionDefs,
  currentPermissions,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [perms, setPerms] = React.useState<Record<string, boolean>>(currentPermissions);
  const [loading, setLoading] = React.useState(false);

  function handleToggle(path: string, checked: boolean) {
    setPerms((prev) => ({ ...prev, [path]: checked }));
  }

  async function handleSave() {
    setLoading(true);
    await updateUserPermissions(userId, perms);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const entries = Object.entries(permissionDefs);
  if (entries.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Shield className="mr-1 h-3.5 w-3.5" />
            Permissions
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Permissions — {userName} ({role})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Activez ou desactivez l&apos;acces aux pages pour cet utilisateur.
          </p>
          <div className="space-y-3">
            {entries.map(([path, def]) => (
              <div
                key={path}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <Label className="text-sm font-medium">{def.label}</Label>
                  <p className="text-xs text-muted-foreground">{path}</p>
                </div>
                <Switch
                  checked={perms[path] ?? def.default}
                  onCheckedChange={(checked) => handleToggle(path, checked)}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
