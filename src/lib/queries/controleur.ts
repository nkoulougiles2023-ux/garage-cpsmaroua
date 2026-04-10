import { db } from "@/lib/db";
import {
  StatutOR,
  StatutPicklist,
  StatutPanne,
  StatutIntervention,
  TypeMouvement,
  StatutMouvement,
} from "@prisma/client";

export async function getControleurStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    pannesNonAssignees,
    interventionsEnCours,
    picklistsEnAttente,
    interventionsTermineeCeMois,
    picklistsSigneesCeMois,
    entreesEnAttente,
  ] = await Promise.all([
    db.panne.count({
      where: { statut: StatutPanne.SIGNALE, mecanicienNom: null },
    }),
    db.intervention.count({
      where: { statut: StatutIntervention.EN_COURS },
    }),
    db.picklist.count({
      where: { statut: StatutPicklist.APPROUVE_ADMIN },
    }),
    db.intervention.count({
      where: {
        statut: StatutIntervention.TERMINE,
        dateFin: { gte: startOfMonth },
      },
    }),
    db.picklist.count({
      where: {
        statut: { in: [StatutPicklist.SIGNE, StatutPicklist.DELIVRE] },
        signatureControleur: { not: null },
      },
    }),
    db.mouvementStock.count({
      where: {
        type: TypeMouvement.ENTREE,
        statutValidation: StatutMouvement.EN_ATTENTE,
      },
    }),
  ]);
  return {
    pannesNonAssignees,
    interventionsEnCours,
    picklistsEnAttente,
    interventionsTermineeCeMois,
    picklistsSigneesCeMois,
    entreesEnAttente,
  };
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
    where: { statut: StatutPicklist.APPROUVE_ADMIN },
    include: {
      ordreReparation: { select: { numeroOR: true } },
      items: { include: { piece: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingStockEntries() {
  return db.mouvementStock.findMany({
    where: {
      type: TypeMouvement.ENTREE,
      statutValidation: StatutMouvement.EN_ATTENTE,
    },
    include: {
      piece: { select: { codeBarre: true, designation: true } },
      effectuePar: { select: { nom: true, prenom: true } },
    },
    orderBy: { date: "desc" },
  });
}
