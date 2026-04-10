"use server";

import { db } from "@/lib/db";
import { StatutOR, StatutPicklist } from "@prisma/client";

export async function getReportStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalVehicules,
    totalOrdres,
    ordresEnCours,
    ordresClotures,
    revenusMois,
    revenusTotal,
    piecesEnStock,
    piecesStockBas,
    picklistsEnAttente,
    ordresRecentsClotures,
  ] = await Promise.all([
    db.vehicle.count(),
    db.ordreReparation.count(),
    db.ordreReparation.count({ where: { statut: StatutOR.EN_COURS } }),
    db.ordreReparation.count({ where: { statut: StatutOR.CLOTURE } }),
    db.paiement.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { montant: true },
    }),
    db.paiement.aggregate({ _sum: { montant: true } }),
    db.piece.count({ where: { quantiteEnStock: { gt: 0 } } }),
    db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count FROM "Piece"
      WHERE "quantiteEnStock" <= "seuilAlerte"
    `.then((r) => Number(r[0]?.count ?? 0)),
    db.picklist.count({ where: { statut: StatutPicklist.EN_ATTENTE } }),
    db.ordreReparation.findMany({
      where: { statut: StatutOR.CLOTURE },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { vehicle: true },
    }),
  ]);

  return {
    totalVehicules,
    totalOrdres,
    ordresEnCours,
    ordresClotures,
    revenusMois: revenusMois._sum.montant ?? 0,
    revenusTotal: revenusTotal._sum.montant ?? 0,
    piecesEnStock,
    piecesStockBas,
    picklistsEnAttente,
    ordresRecentsClotures,
  };
}
