"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const defaultPermissionsByRole: Record<string, Record<string, { label: string; default: boolean }>> = {
  RECEPTIONNISTE: {
    "/reception/dashboard": { label: "Tableau de bord", default: true },
    "/reception/nouveau": { label: "Nouvelle reception", default: true },
    "/ordres": { label: "Ordres de reparation", default: true },
    "/picklists": { label: "Picklists", default: true },
    "/paiements": { label: "Paiements", default: true },
    "/factures": { label: "Factures", default: true },
  },
  MAGASINIER: {
    "/magasin/dashboard": { label: "Tableau de bord", default: true },
    "/magasin": { label: "Inventaire", default: true },
    "/magasin/entree": { label: "Entree de stock", default: true },
    "/picklists": { label: "Picklists a livrer", default: true },
    "/magasin/mouvements": { label: "Mouvements de stock", default: true },
    "/magasin/alertes": { label: "Alertes stock bas", default: true },
  },
  CONTROLEUR: {
    "/controleur": { label: "Panneau de commandes", default: true },
    "/ordres": { label: "Ordres de reparation", default: true },
    "/picklists": { label: "Picklists", default: true },
    "/paiements": { label: "Paiements", default: true },
    "/factures": { label: "Factures", default: true },
  },
};

export async function getPermissionDefinitions(role: string) {
  return defaultPermissionsByRole[role] ?? {};
}

export async function getUserPermissions(userId: string, role: string): Promise<Record<string, boolean>> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { permissions: true },
  });
  const stored = (user?.permissions as Record<string, boolean> | null) ?? {};
  const definitions = defaultPermissionsByRole[role] ?? {};

  const result: Record<string, boolean> = {};
  for (const [path, def] of Object.entries(definitions)) {
    result[path] = stored[path] !== undefined ? stored[path] : def.default;
  }
  return result;
}

export async function updateUserPermissions(
  userId: string,
  permissions: Record<string, boolean>
) {
  await db.user.update({
    where: { id: userId },
    data: { permissions },
  });
  revalidatePath("/utilisateurs");
  return { data: { success: true } };
}
