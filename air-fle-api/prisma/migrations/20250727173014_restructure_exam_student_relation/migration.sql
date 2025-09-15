/*
  Warnings:

  - You are about to drop the column `exam_score` on the `Exams` table. All the data in the column will be lost.
  - You are about to drop the column `student_uuid` on the `Exams` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Exams" DROP CONSTRAINT "Exams_student_uuid_fkey";

-- AlterTable
ALTER TABLE "Exams" DROP COLUMN "exam_score",
DROP COLUMN "student_uuid",
ADD COLUMN     "exam_type" VARCHAR(50) NOT NULL DEFAULT 'written';

-- CreateTable
CREATE TABLE "student_exams" (
    "student_uuid" TEXT NOT NULL,
    "exam_uuid" TEXT NOT NULL,
    "exam_score" VARCHAR(50),
    "exam_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "exam_notes" VARCHAR(500),
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_exams_pkey" PRIMARY KEY ("student_uuid","exam_uuid")
);

-- AddForeignKey
ALTER TABLE "student_exams" ADD CONSTRAINT "student_exams_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_exams" ADD CONSTRAINT "student_exams_exam_uuid_fkey" FOREIGN KEY ("exam_uuid") REFERENCES "Exams"("exam_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
