import type { Content } from '@/schemas/bibles/contents';

export const contentsToText = (contents: Content[]) => {
  let string = '';
  for (const content of contents) {
    switch (content.type) {
      case 'text':
        string += content.text;
        break;
      case 'ref':
        console.debug('Ignoring ref content');
        break;
      case 'verse':
        string += `${content.number} `;
        break;
      case 'note':
        console.debug('Ignoring note content');
        break;
      case 'char':
        string += contentsToText(content.contents);
        break;
      case 'para':
        string += contentsToText(content.contents);
        break;
      default:
        throw new Error('Unhandled content type');
    }
  }
  return string;
};
