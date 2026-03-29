"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getMyReparations() {
  const session = await auth();
  if (!session?.user) return [];
  const clientId = (session.user as any).clientId;
  if (!clientId) return [];
  return db.ordreReparation.findMany({
    where: { vehicle: { clientId } },
    include: {
      vehicle: true,
      pannes: true,
      interventions: true,
      _count: { select: { picklists: true } },
    },
    orderBy: { dateEntree: "desc" },
  });
}

export async function getMyFactures() {
  const session = await auth();
  if (!session?.user) return [];
  const clientId = (session.user as any).clientId;
  if (!clientId) return [];
  return db.facture.findMany({
    where: { clientId },
    include: {
      ordreReparation: {
        select: {
          numeroOR: true,
          vehicle: {
            select: { matricule: true, marque: true, modele: true },
          },
        },
      },
    },
    orderBy: { dateEmission: "desc" },
  });
}
