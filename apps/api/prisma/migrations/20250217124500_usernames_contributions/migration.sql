ALTER TABLE "users" ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TYPE "ContributionType" AS ENUM ('theory_vote', 'theory_approved');

CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theory_id" TEXT NOT NULL,
    "type" "ContributionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contributions_theory_id_fkey" FOREIGN KEY ("theory_id") REFERENCES "theories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "contributions_user_id_theory_id_type_key" ON "contributions"("user_id", "theory_id", "type");
CREATE INDEX "contributions_user_id_idx" ON "contributions"("user_id");
CREATE INDEX "contributions_type_idx" ON "contributions"("type");
