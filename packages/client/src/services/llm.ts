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
    const data = await response.json();
    throw new Error(data.error || 'Error retrieving language models.');
  }

  const modelInfos: { [k: string]: ModelInfo } = await response.json();

  return modelInfos;
}
