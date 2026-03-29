-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONNISTE', 'MAGASINIER', 'CONTROLEUR', 'CLIENT');

-- CreateEnum
CREATE TYPE "TypeVehicule" AS ENUM ('VOITURE', 'CAMION', 'BUS');

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('TOLERIE', 'SOUDURE', 'ELECTRICITE', 'POIDS_LOURDS', 'POIDS_LEGERS');

-- CreateEnum
CREATE TYPE "StatutOR" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'CLOTURE');

-- CreateEnum
CREATE TYPE "StatutPanne" AS ENUM ('SIGNALE', 'EN_COURS', 'RESOLU');

-- CreateEnum
CREATE TYPE "StatutIntervention" AS ENUM ('EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutPicklist" AS ENUM ('EN_ATTENTE', 'APPROUVE_ADMIN', 'SIGNE', 'DELIVRE');

-- CreateEnum
CREATE TYPE "StatutPaiementPicklist" AS ENUM ('NON_PAYE', 'PAYE');

-- CreateEnum
CREATE TYPE "StatutFacture" AS ENUM ('EN_ATTENTE', 'PAYEE');

-- CreateEnum
CREATE TYPE "TypePaiement" AS ENUM ('ACOMPTE', 'PICKLIST', 'SOLDE_FINAL');

-- CreateEnum
CREATE TYPE "MethodePaiement" AS ENUM ('ESPECES', 'MOBILE_MONEY', 'VIREMENT');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "adresse" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "typeVehicule" "TypeVehicule" NOT NULL,
    "numeroChassis" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdreReparation" (
    "id" TEXT NOT NULL,
    "numeroOR" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "chauffeurNom" TEXT NOT NULL,
    "chauffeurTel" TEXT NOT NULL,
    "serviceDorigine" TEXT,
    "kilometrage" INTEGER NOT NULL,
    "niveauCarburant" TEXT NOT NULL,
    "niveauUsurePneus" TEXT NOT NULL,
    "lotDeBord" TEXT,
    "prochaineVidange" TEXT,
    "dateEntree" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSortie" TIMESTAMP(3),
    "statut" "StatutOR" NOT NULL DEFAULT 'EN_ATTENTE',
    "signatureChauffeur" TEXT,
    "signatureControleur" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdreReparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panne" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "section" "Section",
    "statut" "StatutPanne" NOT NULL DEFAULT 'SIGNALE',
    "mecanicienNom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "mecanicienNom" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "description" TEXT NOT NULL,
    "heuresTravail" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tauxHoraire" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutIntervention" NOT NULL DEFAULT 'EN_COURS',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piece" (
    "id" TEXT NOT NULL,
    "codeBarre" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "categorie" TEXT,
    "prixUnitaire" INTEGER NOT NULL,
    "quantiteEnStock" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 5,
    "emplacement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Picklist" (
    "id" TEXT NOT NULL,
    "numeroPicklist" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "mecanicienNom" TEXT NOT NULL,
    "statut" "StatutPicklist" NOT NULL DEFAULT 'EN_ATTENTE',
    "signatureControleur" TEXT,
    "signatureAdmin" TEXT,
    "paiementStatut" "StatutPaiementPicklist" NOT NULL DEFAULT 'NON_PAYE',
    "montantTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Picklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PicklistItem" (
    "id" TEXT NOT NULL,
    "picklistId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,

    CONSTRAINT "PicklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "type" "TypeMouvement" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "picklistId" TEXT,
    "motif" TEXT,
    "effectueParId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheCloture" (
    "id" TEXT NOT NULL,
    "numeroCloture" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "signatureControleur" TEXT,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FicheCloture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "numeroFacture" TEXT NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "montantPieces" INTEGER NOT NULL DEFAULT 0,
    "montantMainOeuvre" INTEGER NOT NULL DEFAULT 0,
    "montantTotal" INTEGER NOT NULL DEFAULT 0,
    "montantPaye" INTEGER NOT NULL DEFAULT 0,
    "montantRestant" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutFacture" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "type" "TypePaiement" NOT NULL,
    "methode" "MethodePaiement" NOT NULL,
    "ordreReparationId" TEXT NOT NULL,
    "picklistId" TEXT,
    "factureId" TEXT,
    "referencePaiement" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_telephone_key" ON "Client"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_matricule_key" ON "Vehicle"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "OrdreReparation_numeroOR_key" ON "OrdreReparation"("numeroOR");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_codeBarre_key" ON "Piece"("codeBarre");

-- CreateIndex
CREATE UNIQUE INDEX "Picklist_numeroPicklist_key" ON "Picklist"("numeroPicklist");

-- CreateIndex
CREATE UNIQUE INDEX "FicheCloture_numeroCloture_key" ON "FicheCloture"("numeroCloture");

-- CreateIndex
CREATE UNIQUE INDEX "FicheCloture_ordreReparationId_key" ON "FicheCloture"("ordreReparationId");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numeroFacture_key" ON "Facture"("numeroFacture");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_ordreReparationId_key" ON "Facture"("ordreReparationId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreReparation" ADD CONSTRAINT "OrdreReparation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panne" ADD CONSTRAINT "Panne_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Picklist" ADD CONSTRAINT "Picklist_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PicklistItem" ADD CONSTRAINT "PicklistItem_picklistId_fkey" FOREIGN KEY ("picklistId") REFERENCES "Picklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PicklistItem" ADD CONSTRAINT "PicklistItem_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_picklistId_fkey" FOREIGN KEY ("picklistId") REFERENCES "Picklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_effectueParId_fkey" FOREIGN KEY ("effectueParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheCloture" ADD CONSTRAINT "FicheCloture_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_ordreReparationId_fkey" FOREIGN KEY ("ordreReparationId") REFERENCES "OrdreReparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_picklistId_fkey" FOREIGN KEY ("picklistId") REFERENCES "Picklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
