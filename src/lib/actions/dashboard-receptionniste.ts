"use server";

import { db } from "@/lib/db";
import { StatutOR } from "@prisma/client";

export async function getReceptionnisteDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    vehiculesRecusCeMois,
    vehiculesRecusAujourdhui,
    ordresEnAttente,
    ordresEnCours,
    ordresClotureCeMois,
    recentOrdres,
    picklistsEnAttente,
    totalClients,
  ] = await Promise.all([
    db.ordreReparation.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.ordreReparation.count({ where: { createdAt: { gte: today } } }),
    db.ordreReparation.count({ where: { statut: StatutOR.EN_ATTENTE } }),
    db.ordreReparation.count({ where: { statut: StatutOR.EN_COURS } }),
    db.ordreReparation.count({
      where: { statut: StatutOR.CLOTURE, updatedAt: { gte: startOfMonth } },
    }),
    db.ordreReparation.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { vehicle: { include: { client: true } } },
    }),
    db.picklist.count({ where: { statut: "EN_ATTENTE" } }),
    db.client.count(),
  ]);

  return {
    vehiculesRecusCeMois,
    vehiculesRecusAujourdhui,
    ordresEnAttente,
    ordresEnCours,
    ordresClotureCeMois,
    recentOrdres,
    picklistsEnAttente,
    totalClients,
  };
}
