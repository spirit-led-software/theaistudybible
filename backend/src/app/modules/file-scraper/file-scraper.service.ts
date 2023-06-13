import { default as s3Config } from '@configs/aws-s3.config';
import { default as milvusConfig } from '@configs/milvus.config';
import { default as unstructuredConfig } from '@configs/unstructured.config';
import { Injectable } from '@nestjs/common';
import { createEmbeddings } from '@utils/openai';
import { S3Loader } from 'langchain/document_loaders/web/s3';
import { Milvus } from 'langchain/vectorstores/milvus';

@Injectable()
export class FileScraperService {
  async scrapeFile(s3Key) {
    const loader = new S3Loader({
      bucket: s3Config.bucketName,
      key: s3Key,
      s3Config: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      unstructuredAPIURL: unstructuredConfig.apiUrl,
    });

    const docs = await loader.loadAndSplit();
    const embeddings = createEmbeddings();
    await Milvus.fromDocuments(docs, embeddings, {
      url: milvusConfig.url,
      collectionName: milvusConfig.collectionName,
      username: milvusConfig.user,
      password: milvusConfig.password,
    });
  }
}
