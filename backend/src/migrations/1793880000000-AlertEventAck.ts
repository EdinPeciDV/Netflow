import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertEventAck1793880000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_events" ADD COLUMN "acknowledgedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_events" DROP COLUMN "acknowledgedAt"`,
    );
  }
}
