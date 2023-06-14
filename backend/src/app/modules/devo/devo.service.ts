import axios from '@configs/axios.config';
import { getVectorStore } from '@configs/milvus.config';
import { getModel } from '@configs/openai.config';
import { SourceDocument } from '@modules/query/entities/source-document.entity';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { Repository } from 'typeorm';
import { CreateDevoDto } from './dto/create-devo.dto';
import { UpdateDevoDto } from './dto/update-devo.dto';
import { Devo } from './entities/devo.entity';

@Injectable()
export class DevoService {
  constructor(
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
    const response = await axios.get(
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
    Logger.log(`Creating devo with verse: ${bibleVerse}`);
    const fullPrompt = PromptTemplate.fromTemplate(`Given the context:
{context}

And the following Bible verse:
{bibleVerse}

Write a daily devotional between 800 to 1000 words. Start by reciting the Bible verse,
then write a summary of the verse which should include other related Bible verses.
The summary can include a story or an analogy. Then, write a reflection on the verse.
Finally, write a prayer to wrap up the devotional.`);
    const vectorStore = await getVectorStore();
    const context = await vectorStore.similaritySearch(bibleVerse);
    const chain = new LLMChain({
      llm: getModel(),
      prompt: fullPrompt,
      verbose: true,
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
        where: { pageContent: sourceDocument.pageContent },
      });
      if (!sourceDocumentEntity) {
        sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.pageContent = sourceDocument.pageContent;
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

  async findOne(id: number) {
    return await this.devoRepository.findOneBy({ id });
  }

  async update(id: number, updateDevoDto: UpdateDevoDto) {
    const devoEntity = await this.devoRepository.findOneByOrFail({ id });
    devoEntity.content = updateDevoDto.content;
    return await this.devoRepository.save(devoEntity);
  }

  async remove(id: number) {
    return await this.devoRepository.delete({ id });
  }
}
