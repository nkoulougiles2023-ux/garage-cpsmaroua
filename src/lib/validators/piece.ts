import { z } from "zod";

export const pieceSchema = z.object({
  codeBarre: z.string().min(1, "Le code-barre est requis"),
  designation: z.string().min(1, "La désignation est requise"),
  categorie: z.string().optional(),
  prixUnitaire: z.coerce.number().min(0, "Le prix doit être positif"),
  quantiteEnStock: z.coerce.number().min(0, "La quantité doit être positive"),
  seuilAlerte: z.coerce.number().min(0).default(5),
  emplacement: z.string().optional(),
});

export type PieceFormData = z.infer<typeof pieceSchema>;
