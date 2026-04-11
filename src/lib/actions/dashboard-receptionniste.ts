"use server";

import { db } from "@/lib/db";
import { StatutOR, StatutPicklist } from "@prisma/client";

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
    totalClients,
    clients,
    vehicles,
    picklists,
    fichesCloture,
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
    db.client.count(),
    db.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { vehicles: { select: { matricule: true } } },
    }),
    db.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { client: { select: { nom: true, prenom: true, telephone: true } } },
    }),
    db.picklist.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        ordreReparation: { select: { numeroOR: true } },
        items: { select: { id: true } },
      },
    }),
    db.ficheCloture.findMany({
      take: 10,
      orderBy: { dateGeneration: "desc" },
      include: {
        ordreReparation: {
          select: { numeroOR: true, vehicle: { select: { matricule: true, marque: true } } },
        },
      },
    }),
  ]);

  return {
    vehiculesRecusCeMois,
    vehiculesRecusAujourdhui,
    ordresEnAttente,
    ordresEnCours,
    ordresClotureCeMois,
    recentOrdres,
    totalClients,
    clients,
    vehicles,
    picklists,
    fichesCloture,
  };
}
