import { TensorFlowEmbeddings } from 'langchain/embeddings/tensorflow';

export function createEmbeddings() {
  return new TensorFlowEmbeddings();
}
