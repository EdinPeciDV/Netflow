import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertRuleCooldown1793793600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_rules" ADD COLUMN "cooldownSeconds" integer NOT NULL DEFAULT 300`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_rules" DROP COLUMN "cooldownSeconds"`,
    );
  }
}
