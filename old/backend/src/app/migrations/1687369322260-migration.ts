import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1687369322260 implements MigrationInterface {
    name = 'Migration1687369322260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_message"
                RENAME COLUMN "message" TO "text"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_message"
                RENAME COLUMN "text" TO "message"
        `);
    }

}
