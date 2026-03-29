"use server";

import { db } from "@/lib/db";

export async function getMagasinierDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalReferences,
    totalValeur,
    piecesEnRupture,
    allPieces,
    mouvementsAujourdhui,
    mouvementsCeMois,
    recentMouvements,
    picklistsALivrer,
  ] = await Promise.all([
    db.piece.count(),
    db.piece.aggregate({ _sum: { quantiteEnStock: true } }),
    db.piece.count({ where: { quantiteEnStock: 0 } }),
    db.piece.findMany(),
    db.mouvementStock.count({ where: { date: { gte: today } } }),
    db.mouvementStock.count({ where: { date: { gte: startOfMonth } } }),
    db.mouvementStock.findMany({
      take: 8,
      orderBy: { date: "desc" },
      include: {
        piece: { select: { codeBarre: true, designation: true } },
        effectuePar: { select: { nom: true, prenom: true } },
      },
    }),
    db.picklist.count({ where: { statut: "SIGNE" } }),
  ]);

  const piecesStockBas = allPieces.filter(
    (p) => p.quantiteEnStock > 0 && p.quantiteEnStock <= p.seuilAlerte
  ).length;

  const topAlerts = allPieces
    .filter((p) => p.quantiteEnStock <= p.seuilAlerte)
    .sort((a, b) => a.quantiteEnStock - b.quantiteEnStock)
    .slice(0, 5);

  return {
    totalReferences,
    totalUnites: totalValeur._sum.quantiteEnStock ?? 0,
    piecesEnRupture,
    piecesStockBas,
    mouvementsAujourdhui,
    mouvementsCeMois,
    recentMouvements,
    topAlerts,
    picklistsALivrer,
  };
}
