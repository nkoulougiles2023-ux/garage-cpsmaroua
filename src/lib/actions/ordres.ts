"use server";

import { db } from "@/lib/db";
import { ordreSchema } from "@/lib/validators/ordre";
import { generateNumeroOR } from "@/lib/utils/numbering";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { StatutOR, StatutPanne } from "@prisma/client";
import { createNotificationForAllStaff } from "./notifications";

export async function createOrdreReparation(data: unknown) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  const parsed = ordreSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const numeroOR = await generateNumeroOR();

  const ordre = await db.ordreReparation.create({
    data: {
      numeroOR,
      vehicleId: parsed.data.vehicleId,
      chauffeurNom: parsed.data.chauffeurNom,
      chauffeurTel: parsed.data.chauffeurTel,
      serviceDorigine: parsed.data.serviceDorigine || null,
      kilometrage: parsed.data.kilometrage,
      niveauCarburant: parsed.data.niveauCarburant,
      niveauUsurePneus: parsed.data.niveauUsurePneus,
      lotDeBord: parsed.data.lotDeBord || null,
      prochaineVidange: parsed.data.prochaineVidange || null,
      createdById: session.user.id!,
      pannes: {
        create: parsed.data.pannes.map((p) => ({
          description: p.description,
          statut: StatutPanne.SIGNALE,
        })),
      },
    },
    include: { pannes: true, vehicle: { include: { client: true } } },
  });

  revalidatePath("/ordres");
  revalidatePath("/dashboard");

  // Notify all staff about new OR
  await createNotificationForAllStaff(
    "Nouvel OR créé",
    `Ordre de réparation ${numeroOR} — ${ordre.vehicle.matricule} (${ordre.vehicle.client.nom})`,
    `/ordres/${ordre.id}`,
    session.user.id!
  );

  return { data: ordre };
}

export async function getOrdres(statut?: StatutOR | StatutOR[]) {
  const where = statut
    ? { statut: Array.isArray(statut) ? { in: statut } : statut }
    : undefined;
  return db.ordreReparation.findMany({
    where,
    include: {
      vehicle: { include: { client: true } },
      pannes: true,
      _count: { select: { picklists: true, interventions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrdreById(id: string) {
  const ordre = await db.ordreReparation.findUnique({
    where: { id },
    include: {
      vehicle: { include: { client: true } },
      pannes: true,
      interventions: true,
      picklists: { include: { items: { include: { piece: true } } } },
      paiements: true,
      facture: true,
      ficheCloture: true,
      createdBy: { select: { nom: true, prenom: true } },
    },
  });
  if (!ordre) return null;

  // Convert Decimal fields to plain numbers for Client Component serialization
  return {
    ...ordre,
    interventions: ordre.interventions.map((int) => ({
      ...int,
      heuresTravail: Number(int.heuresTravail),
    })),
  };
}

export async function signORChauffeur(ordreId: string, signature: string) {
  const ordre = await db.ordreReparation.update({
    where: { id: ordreId },
    data: { signatureChauffeur: signature },
  });
  revalidatePath(`/ordres/${ordreId}`);
  return { data: ordre };
}

export async function updateOrdreStatut(ordreId: string, statut: StatutOR) {
  const ordre = await db.ordreReparation.update({
    where: { id: ordreId },
    data: {
      statut,
      ...(statut === StatutOR.CLOTURE ? { dateSortie: new Date() } : {}),
    },
  });
  revalidatePath(`/ordres/${ordreId}`);
  revalidatePath("/ordres");
  revalidatePath("/dashboard");
  return { data: ordre };
}
