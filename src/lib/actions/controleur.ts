"use server";

import { db } from "@/lib/db";
import {
  StatutOR,
  StatutPicklist,
  StatutPanne,
  StatutIntervention,
} from "@prisma/client";

export async function getControleurStats() {
  const [pannesNonAssignees, interventionsEnCours, picklistsEnAttente] =
    await Promise.all([
      db.panne.count({
        where: { statut: StatutPanne.SIGNALE, mecanicienNom: null },
      }),
      db.intervention.count({
        where: { statut: StatutIntervention.EN_COURS },
      }),
      db.picklist.count({
        where: { statut: StatutPicklist.EN_ATTENTE },
      }),
    ]);
  return { pannesNonAssignees, interventionsEnCours, picklistsEnAttente };
}

export async function getOrdresByStatut() {
  const ordres = await db.ordreReparation.findMany({
    include: {
      vehicle: { include: { client: true } },
      _count: { select: { pannes: true, interventions: true, picklists: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return {
    enAttente: ordres.filter((o) => o.statut === StatutOR.EN_ATTENTE),
    enCours: ordres.filter((o) => o.statut === StatutOR.EN_COURS),
    cloture: ordres.filter((o) => o.statut === StatutOR.CLOTURE),
  };
}

export async function getPicklistsToSign() {
  return db.picklist.findMany({
    where: { statut: StatutPicklist.EN_ATTENTE },
    include: {
      ordreReparation: { select: { numeroOR: true } },
      items: { include: { piece: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
