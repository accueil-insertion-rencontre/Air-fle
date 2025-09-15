/*
  Warnings:

  - A unique constraint covering the columns `[student_uuid,course_uuid]` on the table `Absences` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Absences_student_uuid_course_uuid_key" ON "Absences"("student_uuid", "course_uuid");
