import { z } from "zod";

export const ordreSchema = z.object({
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  chauffeurNom: z.string().min(1, "Le nom du chauffeur est requis"),
  chauffeurTel: z.string().min(9, "Le numéro du chauffeur est requis"),
  serviceDorigine: z.string().optional(),
  kilometrage: z.coerce.number().min(0, "Le kilométrage doit être positif"),
  niveauCarburant: z.string().min(1, "Le niveau de carburant est requis"),
  niveauUsurePneus: z.string().min(1, "Le niveau d'usure est requis"),
  lotDeBord: z.string().optional(),
  prochaineVidange: z.string().optional(),
  pannes: z.array(z.object({
    description: z.string().min(1, "La description est requise"),
  })).min(1, "Au moins une panne doit être signalée"),
});

export type OrdreFormData = z.infer<typeof ordreSchema>;
