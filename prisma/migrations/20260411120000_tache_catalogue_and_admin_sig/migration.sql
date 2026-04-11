-- CreateTable
CREATE TABLE "TacheCatalogue" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT '',
    "heuresStd" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TacheCatalogue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TacheCatalogue_description_categorie_key" ON "TacheCatalogue"("description", "categorie");

-- CreateIndex
CREATE INDEX "TacheCatalogue_categorie_idx" ON "TacheCatalogue"("categorie");

-- AlterTable Picklist: add taux/totaux
ALTER TABLE "Picklist" ADD COLUMN "tauxHoraire" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Picklist" ADD COLUMN "montantPieces" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Picklist" ADD COLUMN "montantMainOeuvre" INTEGER NOT NULL DEFAULT 0;

-- AlterTable PicklistItem: add tache relation + hours snapshot
ALTER TABLE "PicklistItem" ADD COLUMN "tacheId" TEXT;
ALTER TABLE "PicklistItem" ADD COLUMN "heuresMainOeuvre" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "PicklistItem" ADD CONSTRAINT "PicklistItem_tacheId_fkey"
    FOREIGN KEY ("tacheId") REFERENCES "TacheCatalogue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable FicheCloture: admin signature
ALTER TABLE "FicheCloture" ADD COLUMN "signatureAdmin" TEXT;

-- AlterTable Intervention: default hourly rate 10000 FCFA
ALTER TABLE "Intervention" ALTER COLUMN "tauxHoraire" SET DEFAULT 10000;
