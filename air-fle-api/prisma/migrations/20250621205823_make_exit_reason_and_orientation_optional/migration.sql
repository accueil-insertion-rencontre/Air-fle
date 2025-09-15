-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_exit_reason_uuid_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_orientation_uuid_fkey";

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "orientation_uuid" DROP NOT NULL,
ALTER COLUMN "exit_reason_uuid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_orientation_uuid_fkey" FOREIGN KEY ("orientation_uuid") REFERENCES "Orientations"("orientation_uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_exit_reason_uuid_fkey" FOREIGN KEY ("exit_reason_uuid") REFERENCES "Exit_Reasons"("exit_reason_uuid") ON DELETE SET NULL ON UPDATE CASCADE;
