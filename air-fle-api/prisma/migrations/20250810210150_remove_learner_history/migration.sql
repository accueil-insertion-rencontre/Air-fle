/*
  Warnings:

  - You are about to drop the `learner_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "learner_history" DROP CONSTRAINT "learner_history_changed_by_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "learner_history" DROP CONSTRAINT "learner_history_student_uuid_fkey";

-- DropTable
DROP TABLE "learner_history";
