-- CreateTable
CREATE TABLE "Roles" (
    "role_uuid" TEXT NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("role_uuid")
);

-- CreateTable
CREATE TABLE "Nationalities" (
    "nationality_uuid" TEXT NOT NULL,
    "nationality_label" VARCHAR(256) NOT NULL,

    CONSTRAINT "Nationalities_pkey" PRIMARY KEY ("nationality_uuid")
);

-- CreateTable
CREATE TABLE "French_Levels" (
    "french_level_uuid" TEXT NOT NULL,
    "french_level_code" VARCHAR(50) NOT NULL,
    "french_level_description" VARCHAR(50) NOT NULL,

    CONSTRAINT "French_Levels_pkey" PRIMARY KEY ("french_level_uuid")
);

-- CreateTable
CREATE TABLE "Genders" (
    "gender_uuid" TEXT NOT NULL,
    "gender_label" VARCHAR(50) NOT NULL,

    CONSTRAINT "Genders_pkey" PRIMARY KEY ("gender_uuid")
);

-- CreateTable
CREATE TABLE "Addresses" (
    "address_uuid" TEXT NOT NULL,
    "adress_street" VARCHAR(50) NOT NULL,
    "adress_compladress" VARCHAR(50),
    "adress_zipcode" INTEGER NOT NULL,
    "adress_city" VARCHAR(50) NOT NULL,

    CONSTRAINT "Addresses_pkey" PRIMARY KEY ("address_uuid")
);

-- CreateTable
CREATE TABLE "Exit_Reasons" (
    "exit_reason_uuid" TEXT NOT NULL,
    "exit_reason" VARCHAR(50) NOT NULL,

    CONSTRAINT "Exit_Reasons_pkey" PRIMARY KEY ("exit_reason_uuid")
);

-- CreateTable
CREATE TABLE "Orientations" (
    "orientation_uuid" TEXT NOT NULL,
    "orientation_type" VARCHAR(50) NOT NULL,
    "orientation_description" VARCHAR(50) NOT NULL,

    CONSTRAINT "Orientations_pkey" PRIMARY KEY ("orientation_uuid")
);

-- CreateTable
CREATE TABLE "Periods" (
    "period_uuid" TEXT NOT NULL,
    "period_label" VARCHAR(50) NOT NULL,
    "period_started_at" DATE NOT NULL,
    "period_ended_at" DATE NOT NULL,
    "period_actual_period" BOOLEAN NOT NULL,

    CONSTRAINT "Periods_pkey" PRIMARY KEY ("period_uuid")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "session_uuid" TEXT NOT NULL,
    "session_label" VARCHAR(50) NOT NULL,
    "session_started_at" DATE NOT NULL,
    "session_finished_at" DATE NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("session_uuid")
);

-- CreateTable
CREATE TABLE "Status" (
    "status_uuid" TEXT NOT NULL,
    "status_label" VARCHAR(50) NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("status_uuid")
);

-- CreateTable
CREATE TABLE "Financings" (
    "financing_uuid" TEXT NOT NULL,
    "financing_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "Financings_pkey" PRIMARY KEY ("financing_uuid")
);

-- CreateTable
CREATE TABLE "Disabilities" (
    "disability_uuid" TEXT NOT NULL,
    "disability_label" VARCHAR(100) NOT NULL,
    "disability_description" VARCHAR(255),

    CONSTRAINT "Disabilities_pkey" PRIMARY KEY ("disability_uuid")
);

-- CreateTable
CREATE TABLE "Users" (
    "user_uuid" TEXT NOT NULL,
    "user_firstname" VARCHAR(50) NOT NULL,
    "user_lastname" VARCHAR(50) NOT NULL,
    "user_mail" VARCHAR(50) NOT NULL,
    "user_birthdate" TIMESTAMP(3),
    "user_password" VARCHAR(50) NOT NULL,
    "role_uuid" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_uuid")
);

-- CreateTable
CREATE TABLE "students" (
    "student_uuid" TEXT NOT NULL,
    "student_firstname" VARCHAR(50) NOT NULL,
    "student_lastname" VARCHAR(50) NOT NULL,
    "student_birthdate" DATE NOT NULL,
    "student_place_of_birth" VARCHAR(50),
    "student_mail" VARCHAR(50),
    "student_phone" INTEGER,
    "student_date_test_initial" DATE,
    "student_date_entry_france" DATE,
    "student_commentary" VARCHAR(256),
    "student_created_at" TIMESTAMP(3),
    "student_updated_at" TIMESTAMP(3),
    "student_date_cir" DATE,
    "student_date_residence_permit" DATE,
    "financing_uuid" TEXT NOT NULL,
    "status_uuid" TEXT NOT NULL,
    "orientation_uuid" TEXT NOT NULL,
    "exit_reason_uuid" TEXT NOT NULL,
    "french_level_uuid" TEXT NOT NULL,
    "gender_uuid" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_uuid")
);

-- CreateTable
CREATE TABLE "Tasks" (
    "task_uuid" TEXT NOT NULL,
    "task_title" VARCHAR(50) NOT NULL,
    "task_description" VARCHAR(50),
    "task_status" DECIMAL(15,2) NOT NULL,
    "task_created_at" TIMESTAMP(3) NOT NULL,
    "task_updated_at" TIMESTAMP(3) NOT NULL,
    "task_due_at" TIMESTAMP(3),
    "user_uuid" TEXT,

    CONSTRAINT "Tasks_pkey" PRIMARY KEY ("task_uuid")
);

-- CreateTable
CREATE TABLE "Groups" (
    "group_uuid" TEXT NOT NULL,
    "group_label" VARCHAR(50) NOT NULL,
    "session_uuid" TEXT NOT NULL,

    CONSTRAINT "Groups_pkey" PRIMARY KEY ("group_uuid")
);

-- CreateTable
CREATE TABLE "Courses" (
    "course_uuid" TEXT NOT NULL,
    "course_start_hour" TIMESTAMP(3),
    "course_name" VARCHAR(50),
    "course_end_hour" TIMESTAMP(3),
    "course_day" DATE,
    "group_uuid" TEXT NOT NULL,

    CONSTRAINT "Courses_pkey" PRIMARY KEY ("course_uuid")
);

-- CreateTable
CREATE TABLE "Exams" (
    "exam_uuid" TEXT NOT NULL,
    "exam_label" VARCHAR(50) NOT NULL,
    "exam_taked_at" DATE NOT NULL,
    "exam_score" VARCHAR(50),
    "student_uuid" TEXT NOT NULL,

    CONSTRAINT "Exams_pkey" PRIMARY KEY ("exam_uuid")
);

-- CreateTable
CREATE TABLE "Continuations" (
    "continuation_uuid" TEXT NOT NULL,
    "continuation_temporality" TIMESTAMP(3),
    "continuation_commentary" VARCHAR(50),
    "student_uuid" TEXT NOT NULL,

    CONSTRAINT "Continuations_pkey" PRIMARY KEY ("continuation_uuid")
);

-- CreateTable
CREATE TABLE "Subtasks" (
    "subtask_uuid" TEXT NOT NULL,
    "subtask_title" VARCHAR(50) NOT NULL,
    "subtask_description" VARCHAR(50),
    "subtask_status" VARCHAR(50) NOT NULL,
    "subtask_created_at" TIMESTAMP(3) NOT NULL,
    "subtask_updated_at" TIMESTAMP(3) NOT NULL,
    "task_uuid" TEXT NOT NULL,

    CONSTRAINT "Subtasks_pkey" PRIMARY KEY ("subtask_uuid")
);

-- CreateTable
CREATE TABLE "Absences" (
    "absence_uuid" TEXT NOT NULL,
    "absence_reason" VARCHAR(50),
    "student_uuid" TEXT NOT NULL,
    "course_uuid" TEXT NOT NULL,

    CONSTRAINT "Absences_pkey" PRIMARY KEY ("absence_uuid")
);

-- CreateTable
CREATE TABLE "student_nationalities" (
    "student_uuid" TEXT NOT NULL,
    "nationality_uuid" TEXT NOT NULL,

    CONSTRAINT "student_nationalities_pkey" PRIMARY KEY ("student_uuid","nationality_uuid")
);

-- CreateTable
CREATE TABLE "student_exit_levels" (
    "student_uuid" TEXT NOT NULL,
    "french_level_uuid" TEXT NOT NULL,

    CONSTRAINT "student_exit_levels_pkey" PRIMARY KEY ("student_uuid","french_level_uuid")
);

-- CreateTable
CREATE TABLE "student_addresses" (
    "student_uuid" TEXT NOT NULL,
    "address_uuid" TEXT NOT NULL,

    CONSTRAINT "student_addresses_pkey" PRIMARY KEY ("student_uuid","address_uuid")
);

-- CreateTable
CREATE TABLE "student_groups" (
    "student_uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("student_uuid","group_uuid")
);

-- CreateTable
CREATE TABLE "student_disabilities" (
    "student_uuid" TEXT NOT NULL,
    "disability_uuid" TEXT NOT NULL,

    CONSTRAINT "student_disabilities_pkey" PRIMARY KEY ("student_uuid","disability_uuid")
);

-- CreateTable
CREATE TABLE "user_courses" (
    "user_uuid" TEXT NOT NULL,
    "course_uuid" TEXT NOT NULL,

    CONSTRAINT "user_courses_pkey" PRIMARY KEY ("user_uuid","course_uuid")
);

-- CreateTable
CREATE TABLE "group_periods" (
    "period_uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,

    CONSTRAINT "group_periods_pkey" PRIMARY KEY ("period_uuid","group_uuid")
);

-- CreateTable
CREATE TABLE "learner_history" (
    "learner_history_uuid" TEXT NOT NULL,
    "student_uuid" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50),
    "action_type" VARCHAR(50) NOT NULL,
    "change_type" VARCHAR(100),
    "previous_data" JSONB,
    "new_data" JSONB,
    "description" VARCHAR(500) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by_user_uuid" TEXT,

    CONSTRAINT "learner_history_pkey" PRIMARY KEY ("learner_history_uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_user_mail_key" ON "Users"("user_mail");

-- CreateIndex
CREATE INDEX "learner_history_student_uuid_idx" ON "learner_history"("student_uuid");

-- CreateIndex
CREATE INDEX "learner_history_entity_type_idx" ON "learner_history"("entity_type");

-- CreateIndex
CREATE INDEX "learner_history_action_type_idx" ON "learner_history"("action_type");

-- CreateIndex
CREATE INDEX "learner_history_changed_at_idx" ON "learner_history"("changed_at");

-- CreateIndex
CREATE INDEX "learner_history_student_uuid_changed_at_idx" ON "learner_history"("student_uuid", "changed_at");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_role_uuid_fkey" FOREIGN KEY ("role_uuid") REFERENCES "Roles"("role_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_financing_uuid_fkey" FOREIGN KEY ("financing_uuid") REFERENCES "Financings"("financing_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_status_uuid_fkey" FOREIGN KEY ("status_uuid") REFERENCES "Status"("status_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_orientation_uuid_fkey" FOREIGN KEY ("orientation_uuid") REFERENCES "Orientations"("orientation_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_exit_reason_uuid_fkey" FOREIGN KEY ("exit_reason_uuid") REFERENCES "Exit_Reasons"("exit_reason_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_french_level_uuid_fkey" FOREIGN KEY ("french_level_uuid") REFERENCES "French_Levels"("french_level_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_gender_uuid_fkey" FOREIGN KEY ("gender_uuid") REFERENCES "Genders"("gender_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "Users"("user_uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Groups" ADD CONSTRAINT "Groups_session_uuid_fkey" FOREIGN KEY ("session_uuid") REFERENCES "Sessions"("session_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Courses" ADD CONSTRAINT "Courses_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "Groups"("group_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Continuations" ADD CONSTRAINT "Continuations_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtasks" ADD CONSTRAINT "Subtasks_task_uuid_fkey" FOREIGN KEY ("task_uuid") REFERENCES "Tasks"("task_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absences" ADD CONSTRAINT "Absences_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absences" ADD CONSTRAINT "Absences_course_uuid_fkey" FOREIGN KEY ("course_uuid") REFERENCES "Courses"("course_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_nationalities" ADD CONSTRAINT "student_nationalities_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_nationalities" ADD CONSTRAINT "student_nationalities_nationality_uuid_fkey" FOREIGN KEY ("nationality_uuid") REFERENCES "Nationalities"("nationality_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_exit_levels" ADD CONSTRAINT "student_exit_levels_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_exit_levels" ADD CONSTRAINT "student_exit_levels_french_level_uuid_fkey" FOREIGN KEY ("french_level_uuid") REFERENCES "French_Levels"("french_level_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_addresses" ADD CONSTRAINT "student_addresses_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_addresses" ADD CONSTRAINT "student_addresses_address_uuid_fkey" FOREIGN KEY ("address_uuid") REFERENCES "Addresses"("address_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "Groups"("group_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_disabilities" ADD CONSTRAINT "student_disabilities_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_disabilities" ADD CONSTRAINT "student_disabilities_disability_uuid_fkey" FOREIGN KEY ("disability_uuid") REFERENCES "Disabilities"("disability_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "Users"("user_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_uuid_fkey" FOREIGN KEY ("course_uuid") REFERENCES "Courses"("course_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_periods" ADD CONSTRAINT "group_periods_period_uuid_fkey" FOREIGN KEY ("period_uuid") REFERENCES "Periods"("period_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_periods" ADD CONSTRAINT "group_periods_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "Groups"("group_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_history" ADD CONSTRAINT "learner_history_student_uuid_fkey" FOREIGN KEY ("student_uuid") REFERENCES "students"("student_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_history" ADD CONSTRAINT "learner_history_changed_by_user_uuid_fkey" FOREIGN KEY ("changed_by_user_uuid") REFERENCES "Users"("user_uuid") ON DELETE SET NULL ON UPDATE CASCADE;
