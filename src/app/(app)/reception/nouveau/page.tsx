import { requireRole } from "@/lib/auth-utils";
import { ReceptionForm } from "@/components/reception/reception-form";

export default async function NouvelleReceptionPage() {
  await requireRole(["ADMIN", "RECEPTIONNISTE"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle Réception</h1>
      <ReceptionForm />
    </div>
  );
}
