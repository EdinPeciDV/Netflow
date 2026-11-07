import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertRules1793620800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "alert_rules_metric_enum" AS ENUM (
        'bytes_per_window',
        'packets_per_window',
        'flow_count_per_window'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alert_rules" (
        "id"            uuid                             NOT NULL DEFAULT gen_random_uuid(),
        "name"          character varying                NOT NULL,
        "deviceId"      uuid,
        "metric"        "alert_rules_metric_enum"        NOT NULL DEFAULT 'bytes_per_window',
        "threshold"     bigint                           NOT NULL,
        "windowSeconds" integer                          NOT NULL,
        "protocol"      integer,
        "enabled"       boolean                          NOT NULL DEFAULT true,
        "createdAt"     TIMESTAMP                        NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP                        NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alert_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alert_rules_device" FOREIGN KEY ("deviceId")
          REFERENCES "devices"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_alert_rules_deviceId" ON "alert_rules" ("deviceId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "alert_rules"`);
    await queryRunner.query(`DROP TYPE "alert_rules_metric_enum"`);
  }
}
