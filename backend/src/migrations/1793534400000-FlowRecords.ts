import { MigrationInterface, QueryRunner } from 'typeorm';

export class FlowRecords1793534400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "flow_records" (
        "id"        uuid                     NOT NULL DEFAULT gen_random_uuid(),
        "deviceId"  uuid,
        "srcIp"     character varying        NOT NULL,
        "dstIp"     character varying        NOT NULL,
        "srcPort"   integer                  NOT NULL,
        "dstPort"   integer                  NOT NULL,
        "protocol"  integer                  NOT NULL,
        "bytes"     bigint                   NOT NULL,
        "packets"   integer                  NOT NULL,
        "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endTime"   TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP                NOT NULL DEFAULT now(),
        CONSTRAINT "PK_flow_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_flow_records_device" FOREIGN KEY ("deviceId")
          REFERENCES "devices"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_flow_records_device" ON "flow_records" ("deviceId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_flow_records_startTime" ON "flow_records" ("startTime")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "flow_records"`);
  }
}
