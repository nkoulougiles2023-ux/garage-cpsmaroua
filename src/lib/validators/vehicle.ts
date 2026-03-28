import { z } from "zod";
import { TypeVehicule } from "@prisma/client";

export const vehicleSchema = z.object({
  matricule: z.string().min(1, "Le matricule est requis"),
  marque: z.string().min(1, "La marque est requise"),
  modele: z.string().min(1, "Le modèle est requis"),
  typeVehicule: z.nativeEnum(TypeVehicule),
  numeroChassis: z.string().optional(),
  clientId: z.string().min(1, "Le client est requis"),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
