import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1686850365910 implements MigrationInterface {
    name = 'Migration1686850365910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat" (
                "id" SERIAL NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "subject" character varying NOT NULL,
                CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_message" (
                "id" SERIAL NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "message" character varying NOT NULL,
                "chatId" integer,
                "answerId" integer,
                CONSTRAINT "REL_4b80337f28a9a059862071699f" UNIQUE ("answerId"),
                CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_answer" (
                "id" SERIAL NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "text" character varying NOT NULL,
                CONSTRAINT "PK_8ab7c622ed6b0884d3dc7c52a79" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "source_document" (
                "id" SERIAL NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "pageContent" character varying NOT NULL,
                "metadata" character varying,
                CONSTRAINT "PK_96c4b1ff177b8bcd193d1d66fdd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "devo" (
                "id" SERIAL NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "content" character varying NOT NULL,
                CONSTRAINT "PK_ee35a309ffcffa133d7aeba5dcb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "index_operation" (
                "id" SERIAL NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "type" character varying NOT NULL,
                "status" character varying NOT NULL,
                "metadata" character varying,
                CONSTRAINT "PK_e4a37e3e07e1faef9e22b37e2a4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_answer_source_documents_source_document" (
                "chatAnswerId" integer NOT NULL,
                "sourceDocumentId" integer NOT NULL,
                CONSTRAINT "PK_b379e52d514071467e679f303cc" PRIMARY KEY ("chatAnswerId", "sourceDocumentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c9c0edb911139d0d8a8c64e533" ON "chat_answer_source_documents_source_document" ("chatAnswerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c7d08b75ae8aadd32f11d4e6ac" ON "chat_answer_source_documents_source_document" ("sourceDocumentId")
        `);
        await queryRunner.query(`
            CREATE TABLE "devo_source_documents_source_document" (
                "devoId" integer NOT NULL,
                "sourceDocumentId" integer NOT NULL,
                CONSTRAINT "PK_fa4c6c0a7f6911082ac963bb447" PRIMARY KEY ("devoId", "sourceDocumentId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c68b592cf131a3910b3cef6781" ON "devo_source_documents_source_document" ("devoId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e52c920f8d91c8be6af4576aa7" ON "devo_source_documents_source_document" ("sourceDocumentId")
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_message"
            ADD CONSTRAINT "FK_6d2db5b1118d92e561f5ebc1af0" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_message"
            ADD CONSTRAINT "FK_4b80337f28a9a059862071699f2" FOREIGN KEY ("answerId") REFERENCES "chat_answer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_answer_source_documents_source_document"
            ADD CONSTRAINT "FK_c9c0edb911139d0d8a8c64e5334" FOREIGN KEY ("chatAnswerId") REFERENCES "chat_answer"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_answer_source_documents_source_document"
            ADD CONSTRAINT "FK_c7d08b75ae8aadd32f11d4e6ace" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "devo_source_documents_source_document"
            ADD CONSTRAINT "FK_c68b592cf131a3910b3cef67819" FOREIGN KEY ("devoId") REFERENCES "devo"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "devo_source_documents_source_document"
            ADD CONSTRAINT "FK_e52c920f8d91c8be6af4576aa71" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "devo_source_documents_source_document" DROP CONSTRAINT "FK_e52c920f8d91c8be6af4576aa71"
        `);
        await queryRunner.query(`
            ALTER TABLE "devo_source_documents_source_document" DROP CONSTRAINT "FK_c68b592cf131a3910b3cef67819"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_answer_source_documents_source_document" DROP CONSTRAINT "FK_c7d08b75ae8aadd32f11d4e6ace"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_answer_source_documents_source_document" DROP CONSTRAINT "FK_c9c0edb911139d0d8a8c64e5334"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_message" DROP CONSTRAINT "FK_4b80337f28a9a059862071699f2"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_message" DROP CONSTRAINT "FK_6d2db5b1118d92e561f5ebc1af0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e52c920f8d91c8be6af4576aa7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c68b592cf131a3910b3cef6781"
        `);
        await queryRunner.query(`
            DROP TABLE "devo_source_documents_source_document"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c7d08b75ae8aadd32f11d4e6ac"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c9c0edb911139d0d8a8c64e533"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_answer_source_documents_source_document"
        `);
        await queryRunner.query(`
            DROP TABLE "index_operation"
        `);
        await queryRunner.query(`
            DROP TABLE "devo"
        `);
        await queryRunner.query(`
            DROP TABLE "source_document"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_answer"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_message"
        `);
        await queryRunner.query(`
            DROP TABLE "chat"
        `);
    }

}
