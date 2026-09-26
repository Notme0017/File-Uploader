/*
  Warnings:

  - You are about to drop the column `resourceType` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "resourceType" TEXT;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "resourceType";
