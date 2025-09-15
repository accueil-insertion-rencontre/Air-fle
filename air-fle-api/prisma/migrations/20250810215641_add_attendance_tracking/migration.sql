-- AlterTable
ALTER TABLE "Absences" ADD COLUMN     "absence_notes" VARCHAR(255),
ADD COLUMN     "absence_status" VARCHAR(20) NOT NULL DEFAULT 'absent';

-- AlterTable
ALTER TABLE "Courses" ADD COLUMN     "attendance_taken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attendance_taken_at" TIMESTAMP(3),
ADD COLUMN     "attendance_taken_by_user_uuid" TEXT;

-- AddForeignKey
ALTER TABLE "Courses" ADD CONSTRAINT "Courses_attendance_taken_by_user_uuid_fkey" FOREIGN KEY ("attendance_taken_by_user_uuid") REFERENCES "Users"("user_uuid") ON DELETE SET NULL ON UPDATE CASCADE;
