-- CreateEnum
CREATE TYPE "StatutMouvement" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- AlterTable
ALTER TABLE "MouvementStock" ADD COLUMN     "dateValidation" TIMESTAMP(3),
ADD COLUMN     "statutValidation" "StatutMouvement" NOT NULL DEFAULT 'EN_ATTENTE',
ADD COLUMN     "valideParId" TEXT;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
