-- DropIndex
DROP INDEX "Folder_parentId_idx";

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "parentId" DROP NOT NULL;
