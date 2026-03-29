import { requireRole } from "@/lib/auth-utils";
import { getPieces } from "@/lib/actions/pieces";
import { StockEntryForm } from "@/components/magasin/stock-entry-form";

export default async function StockEntreePage() {
  await requireRole(["ADMIN", "MAGASINIER"]);
  const pieces = await getPieces();

  const pieceOptions = pieces.map((p) => ({
    id: p.id,
    codeBarre: p.codeBarre,
    designation: p.designation,
    stockActuel: p.quantiteEnStock,
  }));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Entree de stock</h1>
      <StockEntryForm pieces={pieceOptions} />
    </div>
  );
}
