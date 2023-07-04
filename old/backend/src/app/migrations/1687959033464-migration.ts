import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1687959033464 implements MigrationInterface {
    name = 'Migration1687959033464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat"
            ADD "userId" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "chat"
            ADD "ipAddress" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat" DROP COLUMN "ipAddress"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat" DROP COLUMN "userId"
        `);
    }

}
