import { createId } from '@/core/utils/id';
import type { CharContent, Content, NoteContent, OwningContent } from '@/schemas/bibles/contents';
import { JSDOM } from 'jsdom';

export const ignoredElements = [
  'book', // Book marker meaningless since books served separately
  'table', // TODO Tables are probably non-biblical content (but confirm)
  'row', // Part of a table
  'cell', // Part of a table
  'sidebar', // Non-biblical info not tied to specific verse
  'periph', // Non-biblical extra info
  'figure', // Illustrations etc
  'optbreak', // Line breaks that are optional (and opting not to use)
  'ms', // TODO Multi-purpose markers (could be useful in future)
] as const;

export const ignoredParaStyles = [
  // <para> Identification [exclude all] - Running headings & table of contents
  'ide', // See https://github.com/schierlm/BibleMultiConverter/issues/67
  'rem', // Remarks (valid in schema though missed in docs)
  'h',
  'h1',
  'h2',
  'h3',
  'h4',
  'toc1',
  'toc2',
  'toc3',
  'toca1',
  'toca2',
  'toca3',

  /* <para> Introductions [exclude all] - Introductionary (non-biblical) content
      Which might be helpful in a printed book, but intro material in apps is usually bad UX,
      and users that really care can research a translations methodology themselves
  */
  'imt',
  'imt1',
  'imt2',
  'imt3',
  'imt4',
  'is',
  'is1',
  'is2',
  'is3',
  'is4',
  'ip',
  'ipi',
  'im',
  'imi',
  'ipq',
  'imq',
  'ipr',
  'iq',
  'iq1',
  'iq2',
  'iq3',
  'iq4',
  'ib',
  'ili',
  'ili1',
  'ili2',
  'ili3',
  'ili4',
  'iot',
  'io',
  'io1',
  'io2',
  'io3',
  'io4',
  'iex',
  'imte',
  'ie',

  /* <para> Headings [exclude some] - Exclude book & chapter headings but keep section headings
      Not excluded: ms# | mr | s# | sr | d | sp | sd#
  */
  'mt',
  'mt1',
  'mt2',
  'mt3',
  'mt4',
  'mte',
  'mte1',
  'mte2',
  'mte3',
  'mte4',
  'cl',
  'cd', // Non-biblical chapter summary, more than heading
  'r', // Parallels to be provided by external data
] as const;

export type ParserState = {
  chapterNumber: number;
  chapterId: string;
  verseNumber: number;
  verseId: string;
  chapterOwningObj?: OwningContent;
  verseOwningObj?: OwningContent;
  contents: {
    [key: number]: {
      id: string;
      contents: Content[];
      verseContents: {
        [key: number]: {
          id: string;
          contents: Content[];
        };
      };
    };
  };
};

export function parseUsx(xmlString: string) {
  const doc = new JSDOM(xmlString, {
    contentType: 'application/xml',
  });
  const usx = doc.window.document.documentElement;

  if (usx.nodeName !== 'usx' || usx.nodeType !== usx.ELEMENT_NODE) {
    throw new Error('Invalid USX document');
  }

  const state: ParserState = {
    chapterNumber: 0,
    chapterId: `chap_${createId()}`,
    verseNumber: 0,
    verseId: `ver_${createId()}`,
    contents: {},
  };

  for (const child of Array.from(usx.childNodes)) {
    if (child.nodeType !== child.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;
    // Ignore extra-biblical elements
    if (ignoredElements.includes(child.nodeName as (typeof ignoredElements)[number])) {
      console.log('Ignoring node:', child.nodeName);
      continue;
    }

    if (child.nodeName === 'chapter') {
      if (element.hasAttribute('eid')) {
        continue; // Ignore chapter end markers
      }

      const chapterNumber = Number.parseInt(element.getAttribute('number') ?? '0');
      if (chapterNumber < 1) {
        throw new Error(`Invalid chapter number ${chapterNumber}`);
      }
      if (chapterNumber !== state.chapterNumber + 1) {
        throw new Error(`Chapter ${chapterNumber} isn't +1 previous ${state.chapterNumber}`);
      }
      const id = `chap_${createId()}`;
      state.chapterNumber = chapterNumber;
      state.chapterId = id;
      state.verseNumber = 0;
      state.contents[state.chapterNumber] = {
        id,
        contents: [],
        verseContents: {},
      };
      continue;
    }

    const style = element.getAttribute('style');
    if (ignoredParaStyles.includes(style as (typeof ignoredParaStyles)[number])) {
      console.log('Ignoring para with style:', style);
      continue;
    }

    if (child.nodeName === 'para') {
      const obj = {
        type: 'para',
        id: `para_${createId()}`,
        attrs: element.attributes
          ? Array.from(element.attributes).reduce(
              (acc, { name: key }) => {
                acc[key] = element.getAttribute(key)!;
                return acc;
              },
              {} as Record<string, string>,
            )
          : undefined,
      } as const;

      const chapterObj: OwningContent = {
        ...obj,
        contents: [],
      };
      const previousChapterOwningObj = state.chapterOwningObj;
      if (previousChapterOwningObj) {
        previousChapterOwningObj.contents.push(chapterObj);
      }
      state.chapterOwningObj = chapterObj;

      const verseObj: OwningContent = {
        ...obj,
        contents: [],
      };
      const previousVerseOwningObj = state.verseOwningObj;
      if (previousVerseOwningObj) {
        previousVerseOwningObj.contents.push(verseObj);
      }
      state.verseOwningObj = verseObj;

      parseContents(state, child.childNodes);

      state.chapterOwningObj = previousChapterOwningObj;
      state.verseOwningObj = previousVerseOwningObj;
      continue;
    }

    throw new Error(`Unhandled element: ${child.nodeName}`);
  }

  return state.contents;
}

export function parseContents(state: ParserState, nodes: NodeListOf<ChildNode>) {
  for (const node of Array.from(nodes)) {
    if (node.nodeType === 3) {
      const element = node as Element;
      const text = element.textContent;
      if (!text) {
        continue;
      }

      addContent(state, {
        type: 'text',
        id: `txt_${createId()}`,
        verseId: state.verseId,
        verseNumber: state.verseNumber,
        text: text.replaceAll('\n', ''),
        attrs: element.attributes
          ? Array.from(element.attributes).reduce(
              (acc, { name: key }) => {
                acc[key] = element.getAttribute(key)!;
                return acc;
              },
              {} as Record<string, string>,
            )
          : undefined,
      });

      continue;
    }

    // Ignore all other node types that aren't elements (e.g. comments), or on ignored list
    if (
      node.nodeType !== 1 ||
      ignoredElements.includes(node.nodeName as (typeof ignoredElements)[number])
    ) {
      console.log('Ignoring node:', node.nodeName);
      continue;
    }

    const element = node as Element;
    if (element.nodeName === 'verse') {
      if (element.hasAttribute('eid')) {
        continue;
      }
      const verseNumber = Number.parseInt(element.getAttribute('number') ?? '0');
      if (verseNumber < 1) {
        throw new Error(`Invalid verse number ${verseNumber}`);
      }
      if (verseNumber !== state.verseNumber + 1) {
        throw new Error(`Verse ${verseNumber} isn't +1 previous ${state.verseNumber}`);
      }

      const id = `ver_${createId()}`;
      state.verseNumber = verseNumber;
      state.verseId = id;
      state.contents[state.chapterNumber].verseContents[state.verseNumber] = {
        id,
        contents: [],
      };

      if (state.verseOwningObj) {
        state.verseOwningObj = {
          ...state.verseOwningObj,
          contents: [],
        };
      }

      addContent(state, {
        type: 'verse',
        id,
        number: verseNumber,
        attrs: element.attributes
          ? Array.from(element.attributes).reduce(
              (acc, { name: key }) => {
                acc[key] = element.getAttribute(key)!;
                return acc;
              },
              {} as Record<string, string>,
            )
          : undefined,
      });
      continue;
    }

    if (element.nodeName === 'char') {
      const char = {
        type: element.nodeName as 'char',
        id: `char_${createId()}`,
        verseId: state.verseId,
        verseNumber: state.verseNumber,
        attrs: element.attributes
          ? Array.from(element.attributes).reduce(
              (acc, { name: key }) => {
                acc[key] = element.getAttribute(key)!;
                return acc;
              },
              {} as Record<string, string>,
            )
          : undefined,
      };

      const chapterObj: CharContent = {
        ...char,
        contents: [],
      };
      const prevChapterOwningObj = state.chapterOwningObj;
      if (prevChapterOwningObj) {
        prevChapterOwningObj.contents.push(chapterObj);
      }
      state.chapterOwningObj = chapterObj;

      const verseObj: OwningContent = {
        ...char,
        contents: [],
      };
      const prevVerseOwningObj = state.verseOwningObj;
      if (prevVerseOwningObj) {
        prevVerseOwningObj.contents.push(verseObj);
      }
      state.verseOwningObj = verseObj;

      parseContents(state, element.childNodes);

      state.chapterOwningObj = prevChapterOwningObj;
      state.verseOwningObj = prevVerseOwningObj;
      continue;
    }

    if (element.nodeName === 'note') {
      const char = {
        type: element.nodeName as 'note',
        id: `note_${createId()}`,
        verseId: state.verseId,
        verseNumber: state.verseNumber,
        attrs: element.attributes
          ? Array.from(element.attributes).reduce(
              (acc, { name: key }) => {
                acc[key] = element.getAttribute(key)!;
                return acc;
              },
              {} as Record<string, string>,
            )
          : undefined,
      };

      const chapterObj: NoteContent = {
        ...char,
        contents: [],
      };
      const prevChapterOwningObj = state.chapterOwningObj;
      if (prevChapterOwningObj) {
        prevChapterOwningObj.contents.push(chapterObj);
      }
      state.chapterOwningObj = chapterObj;

      const verseObj: OwningContent = {
        ...char,
        contents: [],
      };
      const prevVerseOwningObj = state.verseOwningObj;
      if (prevVerseOwningObj) {
        prevVerseOwningObj.contents.push(verseObj);
      }
      state.verseOwningObj = verseObj;

      parseContents(state, element.childNodes);

      state.chapterOwningObj = prevChapterOwningObj;
      state.verseOwningObj = prevVerseOwningObj;
      continue;
    }

    if (element.nodeName === 'ref') {
      addContent(state, {
        type: 'ref',
        id: `ref_${createId()}`,
        verseId: state.verseId,
        verseNumber: state.verseNumber,
        text: element.textContent ?? '',
        attrs: element.attributes
          ? Array.from(element.attributes).reduce(
              (acc, { name: key }) => {
                acc[key] = element.getAttribute(key)!;
                return acc;
              },
              {} as Record<string, string>,
            )
          : undefined,
      });
      continue;
    }

    throw new Error(
      `Unhandled element: ${element.nodeName} ${element.nodeType} in Chapter ${state.chapterNumber} Verse ${state.verseNumber}`,
    );
  }
}

export function addContent(state: ParserState, content: Content) {
  if (state.chapterOwningObj) {
    state.chapterOwningObj.contents.push(content);
    const owning = findOwning(
      state.chapterOwningObj.id,
      state.contents[state.chapterNumber].contents,
    );
    if (!owning) {
      state.contents[state.chapterNumber].contents.push(state.chapterOwningObj);
    }
  } else {
    state.contents[state.chapterNumber].contents.push(content);
  }

  if (state.verseOwningObj) {
    state.verseOwningObj.contents.push(content);
    const verse = state.contents[state.chapterNumber].verseContents[state.verseNumber];
    if (verse) {
      const owning = findOwning(state.verseOwningObj.id, verse.contents);
      if (!owning) {
        verse.contents.push(state.verseOwningObj);
      }
    }
  } else {
    state.contents[state.chapterNumber].verseContents[state.verseNumber]?.contents.push(content);
  }
}

export function findOwning(id: string, contents: Content[]): OwningContent | null {
  for (const content of contents) {
    if (content.type === 'char' || content.type === 'note' || content.type === 'para') {
      if (content.id === id) {
        return content;
      }
      const found = findOwning(id, content.contents);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
