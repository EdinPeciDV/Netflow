import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1793448000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('admin', 'viewer')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"           uuid                NOT NULL DEFAULT gen_random_uuid(),
        "email"        character varying   NOT NULL,
        "passwordHash" character varying   NOT NULL,
        "role"         "users_role_enum"   NOT NULL DEFAULT 'viewer',
        "createdAt"    TIMESTAMP           NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users"       PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id"          uuid                        NOT NULL DEFAULT gen_random_uuid(),
        "name"        character varying           NOT NULL,
        "ipAddress"   character varying           NOT NULL,
        "tokenHash"   character varying,
        "lastSeenAt"  TIMESTAMP WITH TIME ZONE,
        "ownerId"     uuid,
        "createdAt"   TIMESTAMP                   NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP                   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devices"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_devices_owner" FOREIGN KEY ("ownerId")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
