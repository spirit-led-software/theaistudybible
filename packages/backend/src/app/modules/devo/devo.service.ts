import { CreateDevoDto, UpdateDevoDto } from '@dtos/devo';
import { Devo, SourceDocument } from '@entities';
import { LLMService } from '@modules/llm/llm.service';
import { VectorDBService } from '@modules/vector-db/vector-db.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { Repository } from 'typeorm';

@Injectable()
export class DevoService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorDbService: VectorDBService,
    private readonly llmService: LLMService,
    @InjectRepository(Devo) private readonly devoRepository: Repository<Devo>,
    @InjectRepository(SourceDocument)
    private readonly sourceDocumentRepository: Repository<SourceDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: 'createDevo',
    timeZone: 'America/New_York',
  })
  async scheduledCreate() {
    await this.create({});
  }

  async getRandomBibleVerse(): Promise<string> {
    const response = await axios
      .create(this.configService.get('axios'))
      .get(
        'https://labs.bible.org/api?passage=random&type=json&formatting=plain',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    const verseData = response.data[0];
    const verse = `${verseData.bookname} ${verseData.chapter}:${verseData.verse} - ${verseData.text}`;
    return verse;
  }

  async create(createDevoDto: CreateDevoDto) {
    let bibleVerse: string;
    if (!createDevoDto.bibleVerse) {
      bibleVerse = await this.getRandomBibleVerse();
    } else {
      bibleVerse = createDevoDto.bibleVerse;
    }
    this.logger.log(`Creating devo with verse: ${bibleVerse}`);
    const fullPrompt = PromptTemplate.fromTemplate(`Given the context:
{context}

And the following Bible verse:
{bibleVerse}

Write a daily devotional between 800 to 1000 words. Start by reciting the Bible verse,
then write a summary of the verse which should include other related Bible verses.
The summary can include a story or an analogy. Then, write a reflection on the verse.
Finally, write a prayer to wrap up the devotional.`);
    const vectorStore = await this.vectorDbService.getVectorStore();
    const context = await vectorStore.similaritySearch(bibleVerse, 15);
    const chain = new LLMChain({
      llm: this.llmService.getModel(),
      prompt: fullPrompt,
    });
    const result = await chain.call({
      bibleVerse: bibleVerse,
      context: context.map((c) => c.pageContent).join('\n'),
    });
    let devoEntity = new Devo();
    devoEntity.content = result.text;
    const sourceDocumentEntities = [];
    for (const sourceDocument of context) {
      let sourceDocumentEntity = await this.sourceDocumentRepository.findOne({
        where: { content: sourceDocument.pageContent },
      });
      if (!sourceDocumentEntity) {
        sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.content = sourceDocument.pageContent;
        sourceDocumentEntity.metadata = JSON.stringify(sourceDocument.metadata);
        sourceDocumentEntity = await this.sourceDocumentRepository.save(
          sourceDocumentEntity,
        );
        sourceDocumentEntities.push(sourceDocumentEntity);
      }
    }
    devoEntity.sourceDocuments = sourceDocumentEntities;
    devoEntity = await this.devoRepository.save(devoEntity);
    return devoEntity;
  }

  async findAll() {
    return await this.devoRepository.find();
  }

  async findOne(id: string) {
    return await this.devoRepository.findOneBy({ id });
  }

  async update(id: string, updateDevoDto: UpdateDevoDto) {
    const devoEntity = await this.devoRepository.findOneByOrFail({ id });
    devoEntity.content = updateDevoDto.content;
    return await this.devoRepository.save(devoEntity);
  }

  async remove(id: string) {
    return await this.devoRepository.delete({ id });
  }
}
