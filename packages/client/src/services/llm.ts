import type { ModelInfo } from '@revelationsai/core/model/llm';
import apiConfig from '../configs/api';

export async function getLanguageModels() {
  const response = await fetch(`${apiConfig.url}/language-models`, {
    method: 'GET'
  });

  if (!response.ok) {
    console.error(
      `Error retrieving language models. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error retrieving language models.');
  }

  const modelInfos = (await response.json()) as { [k: string]: ModelInfo };

  return modelInfos;
}
