import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertEvents1793707200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "alert_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alertRuleId" uuid NOT NULL,
        "deviceId" uuid,
        "metric" "alert_rules_metric_enum" NOT NULL,
        "value" bigint NOT NULL,
        "triggeredAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alert_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alert_events_rule" FOREIGN KEY ("alertRuleId")
          REFERENCES "alert_rules"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_alert_events_device" FOREIGN KEY ("deviceId")
          REFERENCES "devices"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_events_alertRuleId" ON "alert_events" ("alertRuleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_events_deviceId" ON "alert_events" ("deviceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_events_triggeredAt" ON "alert_events" ("triggeredAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "alert_events"`);
  }
}
