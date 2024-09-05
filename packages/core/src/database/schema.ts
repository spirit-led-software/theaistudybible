import type { Content } from '@/schemas/bibles/contents';
import type { Metadata } from '@/schemas/utils/metadata';
import type { LanguageModelV1FinishReason } from '@ai-sdk/provider';
import type { JSONValue, ToolInvocation } from 'ai';
import { relations } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import {
  customType,
  foreignKey,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createId } from '../utils/id';

const timestamp = customType<{
  data: string | Date;
  driverData: string;
}>({
  dataType: () => 'text',
  toDriver: (value) => (typeof value === 'string' ? value : value.toISOString()),
  fromDriver: (value) => new Date(value),
});

const baseModel = {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

export const roles = sqliteTable('roles', {
  ...baseModel,
  name: text('name').notNull(),
  permissions: text('permissions', { mode: 'json' }).notNull().default([]).$type<string[]>(),
});

export const chats = sqliteTable(
  'chats',
  {
    ...baseModel,
    name: text('name').notNull().default('New Chat'),
    customName: integer('custom_name', { mode: 'boolean' }).notNull().default(false),
    userId: text('user_id').notNull(),
  },
  (table) => {
    return {
      nameIdx: index('chat_name').on(table.name),
    };
  },
);

export const chatsRelations = relations(chats, ({ one, many }) => {
  return {
    messages: many(messages),
    shareOptions: one(shareChatOptions),
  };
});

export const shareChatOptions = sqliteTable(
  'share_chat_options',
  {
    ...baseModel,
    chatId: text('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      chatIdIdx: index('chat_share_options_chat_id').on(table.chatId),
    };
  },
);

export const shareChatOptionsRelations = relations(shareChatOptions, ({ one }) => {
  return {
    chat: one(chats, {
      fields: [shareChatOptions.chatId],
      references: [chats.id],
    }),
  };
});

export const messages = sqliteTable(
  'messages',
  {
    ...baseModel,

    // Fields required by the ai sdk
    content: text('content'),
    tool_call_id: text('tool_call_id'),
    role: text('role', {
      enum: ['system', 'user', 'assistant', 'data'],
    }).notNull(),
    data: text('data', { mode: 'json' }).$type<JSONValue>(),
    annotations: text('annotations', { mode: 'json' }).$type<JSONValue[]>(),
    toolInvocations: text('tool_invocations', { mode: 'json' }).$type<ToolInvocation[]>(),
    finishReason: text('finish_reason').$type<LanguageModelV1FinishReason>(),

    // Custom fields
    anonymous: integer('anonymous', { mode: 'boolean' }).notNull().default(false),
    regenerated: integer('regenerated', { mode: 'boolean' }).notNull().default(false),

    // Relations fields
    chatId: text('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: text('user_id').notNull(),
    originMessageId: text('origin_message_id').references((): AnySQLiteColumn => messages.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  },
  (table) => {
    return {
      roleIdx: index('role').on(table.role),
      contentIdx: index('content').on(table.content),
      chatIdIdx: index('chat_id').on(table.chatId),
      userIdIdx: index('user_id').on(table.userId),
      originMessageIdIdx: index('origin_message_id').on(table.originMessageId),
      anonymousIdx: index('anonymous').on(table.anonymous),
      originMessageReference: foreignKey({
        columns: [table.originMessageId],
        foreignColumns: [table.id],
        name: 'origin_message_reference',
      })
        .onUpdate('cascade')
        .onDelete('cascade'),
    };
  },
);

export const messagesRelations = relations(messages, ({ one, many }) => {
  return {
    chat: one(chats, {
      fields: [messages.chatId],
      references: [chats.id],
    }),
    originMessage: one(messages, {
      fields: [messages.originMessageId],
      references: [messages.id],
      relationName: 'responses',
    }),
    responses: many(messages, {
      relationName: 'responses',
    }),
    reactions: many(messageReactions),
    images: many(userGeneratedImages),
    messagesToSourceDocuments: many(messagesToSourceDocuments),
  };
});

export const messageReactions = sqliteTable(
  'message_reactions',
  {
    ...baseModel,
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    userId: text('user_id').notNull(),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => {
    return {
      messageReactionKey: uniqueIndex('message_reaction_key').on(table.messageId, table.userId),
    };
  },
);

export const messageReactionsRelations = relations(messageReactions, ({ one }) => {
  return {
    message: one(messages, {
      fields: [messageReactions.messageId],
      references: [messages.id],
    }),
  };
});

export const messagesToSourceDocuments = sqliteTable(
  'messages_to_source_documents',
  {
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sourceDocumentId: text('source_document_id').notNull(),
    distance: real('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct'],
    })
      .notNull()
      .default('cosine'),
  },
  (table) => {
    return {
      messageSourceDocumentKey: uniqueIndex('message_source_document_key').on(
        table.messageId,
        table.sourceDocumentId,
      ),
    };
  },
);

export const messagesToSourceDocumentsRelations = relations(
  messagesToSourceDocuments,
  ({ one }) => {
    return {
      message: one(messages, {
        fields: [messagesToSourceDocuments.messageId],
        references: [messages.id],
      }),
    };
  },
);

export const userGeneratedImages = sqliteTable(
  'user_generated_images',
  {
    ...baseModel,
    userId: text('user_id').notNull(),
    messageId: text('message_id').references(() => messages.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    url: text('url'),
    userPrompt: text('user_prompt').notNull(),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt'),
    searchQueries: text('search_queries', { mode: 'json' }).notNull().default([]).$type<string[]>(),
    failed: integer('failed', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => {
    return {
      userIdIdx: index('user_generated_images_user_id').on(table.userId),
      messageIdIdx: index('user_generated_images_message_id').on(table.messageId),
    };
  },
);

export const userGeneratedImagesRelations = relations(userGeneratedImages, ({ one, many }) => {
  return {
    message: one(messages, {
      fields: [userGeneratedImages.messageId],
      references: [messages.id],
    }),
    reactions: many(userGeneratedImagesReactions),
    imagesToSourceDocuments: many(userGeneratedImagesToSourceDocuments),
  };
});

export const userGeneratedImagesReactions = sqliteTable(
  'user_generated_images_reactions',
  {
    ...baseModel,
    userGeneratedImageId: text('user_generated_image_id')
      .notNull()
      .references(() => userGeneratedImages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    userId: text('user_id').notNull(),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => {
    return {
      userGeneratedImageReactionKey: uniqueIndex('user_generated_image_reaction_key').on(
        table.userGeneratedImageId,
        table.userId,
      ),
    };
  },
);

export const userGeneratedImagesReactionsRelations = relations(
  userGeneratedImagesReactions,
  ({ one }) => {
    return {
      userGeneratedImage: one(userGeneratedImages, {
        fields: [userGeneratedImagesReactions.userGeneratedImageId],
        references: [userGeneratedImages.id],
      }),
    };
  },
);

export const userGeneratedImagesToSourceDocuments = sqliteTable(
  'user_generated_images_to_source_documents',
  {
    userGeneratedImageId: text('user_generated_image_id')
      .notNull()
      .references(() => userGeneratedImages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sourceDocumentId: text('source_document_id').notNull(),
    distance: real('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct'],
    })
      .notNull()
      .default('cosine'),
  },
  (table) => {
    return {
      userGeneratedImageSourceDocumentKey: uniqueIndex(
        'user_generated_image_source_document_key',
      ).on(table.userGeneratedImageId, table.sourceDocumentId),
    };
  },
);

export const userGeneratedImagesToSourceDocumentsRelations = relations(
  userGeneratedImagesToSourceDocuments,
  ({ one }) => {
    return {
      userGeneratedImage: one(userGeneratedImages, {
        fields: [userGeneratedImagesToSourceDocuments.userGeneratedImageId],
        references: [userGeneratedImages.id],
      }),
    };
  },
);

export const devotions = sqliteTable(
  'devotions',
  {
    ...baseModel,
    topic: text('topic').notNull().default('general'),
    bibleReading: text('bible_reading').notNull(),
    summary: text('summary').notNull(),
    reflection: text('reflection'),
    prayer: text('prayer'),
    diveDeeperQueries: text('dive_deeper_queries', { mode: 'json' })
      .notNull()
      .default([])
      .$type<string[]>(),
    failed: integer('failed', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => {
    return {
      createdAtIdx: index('devotions_created_at_idx').on(table.createdAt),
    };
  },
);

export const devotionsRelations = relations(devotions, ({ one, many }) => {
  return {
    images: one(devotionImages),
    reactions: many(devotionReactions),
    devotionsToSourceDocuments: many(devotionsToSourceDocuments),
  };
});

export const devotionReactions = sqliteTable(
  'devotion_reactions',
  {
    ...baseModel,
    devotionId: text('devotion_id')
      .notNull()
      .references(() => devotions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    userId: text('user_id').notNull(),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => {
    return {
      devotionIdIdx: index('devotion_reactions_devotion_id').on(table.devotionId),
    };
  },
);

export const devotionReactionsRelations = relations(devotionReactions, ({ one }) => {
  return {
    devotion: one(devotions, {
      fields: [devotionReactions.devotionId],
      references: [devotions.id],
    }),
  };
});

export const devotionImages = sqliteTable(
  'devotion_images',
  {
    ...baseModel,
    devotionId: text('devotion_id')
      .notNull()
      .references(() => devotions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    url: text('url'),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt'),
    caption: text('caption'),
  },
  (table) => {
    return {
      devotionIdIdx: index('devotion_images_devotion_id').on(table.devotionId),
    };
  },
);

export const devotionImagesRelations = relations(devotionImages, ({ one }) => {
  return {
    devotion: one(devotions, {
      fields: [devotionImages.devotionId],
      references: [devotions.id],
    }),
  };
});

export const devotionsToSourceDocuments = sqliteTable(
  'devotions_to_source_documents',
  {
    devotionId: text('devotion_id')
      .notNull()
      .references(() => devotions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sourceDocumentId: text('source_document_id').notNull(),
    distance: real('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct'],
    })
      .notNull()
      .default('cosine'),
  },
  (table) => {
    return {
      devotionSourceDocumentKey: uniqueIndex('devotion_source_document_key').on(
        table.devotionId,
        table.sourceDocumentId,
      ),
    };
  },
);

export const devotionsToSourceDocumentsRelations = relations(
  devotionsToSourceDocuments,
  ({ one }) => {
    return {
      devotion: one(devotions, {
        fields: [devotionsToSourceDocuments.devotionId],
        references: [devotions.id],
      }),
    };
  },
);

export const dataSources = sqliteTable(
  'data_sources',
  {
    ...baseModel,
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: text('type', {
      enum: ['WEB_CRAWL', 'FILE', 'WEBPAGE', 'REMOTE_FILE', 'YOUTUBE'],
    }).notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<Metadata>().default({}).notNull(),
    numberOfDocuments: integer('number_of_documents').notNull().default(0),
    syncSchedule: text('sync_schedule', {
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'NEVER'],
    })
      .notNull()
      .default('NEVER'),
    lastManualSync: timestamp('last_manual_sync', { withTimezone: true }),
    lastAutomaticSync: timestamp('last_automatic_sync', { withTimezone: true }),
  },
  (table) => {
    return {
      nameKey: uniqueIndex('data_sources_name_key').on(table.name),
      typeIdx: index('data_sources_type').on(table.type),
    };
  },
);

export const dataSourcesRelations = relations(dataSources, ({ many }) => {
  return {
    indexOperations: many(indexOperations),
    dataSourcesToSourceDocuments: many(dataSourcesToSourceDocuments),
  };
});

export const dataSourcesToSourceDocuments = sqliteTable(
  'data_sources_to_source_documents',
  {
    dataSourceId: text('data_source_id')
      .notNull()
      .references(() => dataSources.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sourceDocumentId: text('source_document_id').notNull(),
  },
  (table) => {
    return {
      dataSourceSourceDocumentKey: uniqueIndex('data_source_source_document_key').on(
        table.dataSourceId,
        table.sourceDocumentId,
      ),
    };
  },
);

export const dataSourcesToSourceDocumentsRelations = relations(
  dataSourcesToSourceDocuments,
  ({ one }) => {
    return {
      dataSource: one(dataSources, {
        fields: [dataSourcesToSourceDocuments.dataSourceId],
        references: [dataSources.id],
      }),
    };
  },
);

export const indexOperations = sqliteTable(
  'index_operations',
  {
    ...baseModel,
    status: text('status', {
      enum: ['FAILED', 'SUCCEEDED', 'RUNNING', 'COMPLETED'],
    }).notNull(),
    errorMessages: text('error_messages', { mode: 'json' }).notNull().default([]).$type<string[]>(),
    metadata: text('metadata', { mode: 'json' }).notNull().default({}).$type<Metadata>(),
    dataSourceId: text('data_source_id')
      .notNull()
      .references(() => dataSources.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (table) => {
    return {
      statusIdx: index('index_operation_status').on(table.status),
    };
  },
);

export const indexOperationsRelations = relations(indexOperations, ({ one }) => {
  return {
    dataSource: one(dataSources, {
      fields: [indexOperations.dataSourceId],
      references: [dataSources.id],
    }),
  };
});

export const bibles = sqliteTable(
  'bibles',
  {
    ...baseModel,
    abbreviation: text('abbreviation').notNull().unique(),
    abbreviationLocal: text('abbreviation_local').notNull(),
    name: text('name').notNull(),
    nameLocal: text('name_local').notNull(),
    description: text('description').notNull(),
    languageISO: text('language_iso').notNull(),
    countryISOs: text('country_isos', { mode: 'json' }).notNull().default([]).$type<string[]>(),
  },
  (table) => {
    return {
      abbreviationIdx: index('bibles_abbreviation').on(table.abbreviation),
      languageISOIdx: index('bibles_language_iso').on(table.languageISO),
      countryISOsIdx: index('bibles_country_isos').on(table.countryISOs),
    };
  },
);

export const biblesRelations = relations(bibles, ({ many }) => {
  return {
    books: many(books),
    chapters: many(chapters),
    verses: many(verses),
  };
});

export const books = sqliteTable(
  'books',
  {
    ...baseModel,
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    previousId: text('previous_id'),
    nextId: text('next_id'),
    number: integer('number').notNull(),
    abbreviation: text('abbreviation').notNull(),
    shortName: text('short_name').notNull(),
    longName: text('long_name').notNull(),
  },
  (table) => {
    return {
      abbreviationIdx: index('books_abbreviation').on(table.abbreviation),
      shortNameIdx: index('books_short_name').on(table.shortName),
      longNameIdx: index('books_long_name').on(table.longName),
    };
  },
);

export const booksRelations = relations(books, ({ one, many }) => {
  return {
    bible: one(bibles, {
      fields: [books.bibleId],
      references: [bibles.id],
    }),
    previous: one(books, {
      fields: [books.previousId],
      references: [books.id],
      relationName: 'previous',
    }),
    next: one(books, {
      fields: [books.nextId],
      references: [books.id],
      relationName: 'next',
    }),
    chapters: many(chapters),
    verses: many(verses),
  };
});

export const chapters = sqliteTable(
  'chapters',
  {
    ...baseModel,
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    bookId: text('book_id')
      .references(() => books.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    previousId: text('previous_id'),
    nextId: text('next_id'),
    abbreviation: text('abbreviation').notNull(),
    name: text('name').notNull(),
    number: integer('number').notNull(),
    content: text('content', { mode: 'json' }).notNull().$type<Content[]>(),
  },
  (table) => {
    return {
      nameIdx: index('chapters_name').on(table.name),
    };
  },
);

export const chaptersRelations = relations(chapters, ({ one, many }) => {
  return {
    bible: one(bibles, {
      fields: [chapters.bibleId],
      references: [bibles.id],
    }),
    book: one(books, {
      fields: [chapters.bookId],
      references: [books.id],
    }),
    previous: one(chapters, {
      fields: [chapters.previousId],
      references: [chapters.id],
      relationName: 'previous',
    }),
    next: one(chapters, {
      fields: [chapters.nextId],
      references: [chapters.id],
      relationName: 'next',
    }),
    verses: many(verses),
    bookmarks: many(chapterBookmarks),
    notes: many(chapterNotes),
    chaptersToSourceDocuments: many(chaptersToSourceDocuments),
  };
});

export const chapterBookmarks = sqliteTable(
  'chapter_bookmarks',
  {
    ...baseModel,
    chapterId: text('chapter_id')
      .references(() => chapters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    userId: text('user_id').notNull(),
  },
  (table) => {
    return {
      userChapterKey: uniqueIndex('chapter_bookmarks_user_chapter_key').on(
        table.userId,
        table.chapterId,
      ),
      chapterIdIdx: index('chapter_bookmarks_chapter_id').on(table.chapterId),
      userIdIdx: index('chapter_bookmarks_user_id').on(table.userId),
    };
  },
);

export const chapterBookmarksRelations = relations(chapterBookmarks, ({ one }) => {
  return {
    chapter: one(chapters, {
      fields: [chapterBookmarks.chapterId],
      references: [chapters.id],
    }),
  };
});

export const chapterNotes = sqliteTable(
  'chapter_notes',
  {
    ...baseModel,
    chapterId: text('chapter_id')
      .references(() => chapters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
  },
  (table) => {
    return {
      chapterIdIdx: index('chapter_notes_chapter_id').on(table.chapterId),
      userIdIdx: index('chapter_notes_user_id').on(table.userId),
    };
  },
);

export const chapterNotesRelations = relations(chapterNotes, ({ one }) => {
  return {
    chapter: one(chapters, {
      fields: [chapterNotes.chapterId],
      references: [chapters.id],
    }),
  };
});

export const chaptersToSourceDocuments = sqliteTable(
  'chapters_to_source_documents',
  {
    chapterId: text('chapter_id')
      .notNull()
      .references(() => chapters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sourceDocumentId: text('source_document_id').notNull(),
  },
  (table) => {
    return {
      chapterSourceDocumentKey: uniqueIndex('chapter_source_document_key').on(
        table.chapterId,
        table.sourceDocumentId,
      ),
    };
  },
);

export const chaptersToSourceDocumentsRelations = relations(
  chaptersToSourceDocuments,
  ({ one }) => {
    return {
      chapter: one(chapters, {
        fields: [chaptersToSourceDocuments.chapterId],
        references: [chapters.id],
      }),
    };
  },
);

export const verses = sqliteTable(
  'verses',
  {
    ...baseModel,
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    bookId: text('book_id')
      .references(() => books.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    chapterId: text('chapter_id')
      .references(() => chapters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    previousId: text('previous_id'),
    nextId: text('next_id'),
    abbreviation: text('abbreviation').notNull(),
    name: text('name').notNull(),
    number: integer('number').notNull(),
    content: text('content', { mode: 'json' }).notNull().$type<Content[]>(),
  },
  (table) => {
    return {
      nameIdx: index('verses_name').on(table.name),
    };
  },
);

export const versesRelations = relations(verses, ({ one, many }) => {
  return {
    bible: one(bibles, {
      fields: [verses.bibleId],
      references: [bibles.id],
    }),
    book: one(books, {
      fields: [verses.bookId],
      references: [books.id],
    }),
    chapter: one(chapters, {
      fields: [verses.chapterId],
      references: [chapters.id],
    }),
    previous: one(verses, {
      fields: [verses.previousId],
      references: [verses.id],
      relationName: 'previous',
    }),
    next: one(verses, {
      fields: [verses.nextId],
      references: [verses.id],
      relationName: 'next',
    }),
    highlights: many(verseHighlights),
    bookmarks: many(verseBookmarks),
    notes: many(verseNotes),
  };
});

export const verseHighlights = sqliteTable(
  'verse_highlights',
  {
    ...baseModel,
    verseId: text('verse_id')
      .references(() => verses.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    userId: text('user_id').notNull(),
    color: text('color').notNull(),
  },
  (table) => {
    return {
      userVerseKey: uniqueIndex('verse_highlights_user_verse_key').on(table.userId, table.verseId),
      verseIdIdx: index('verse_highlights_verse_id').on(table.verseId),
      userIdIdx: index('verse_highlights_user_id').on(table.userId),
    };
  },
);

export const verseHighlightsRelations = relations(verseHighlights, ({ one }) => {
  return {
    verse: one(verses, {
      fields: [verseHighlights.verseId],
      references: [verses.id],
    }),
  };
});

export const verseBookmarks = sqliteTable(
  'verse_bookmarks',
  {
    ...baseModel,
    verseId: text('verse_id')
      .references(() => verses.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    userId: text('user_id').notNull(),
  },
  (table) => {
    return {
      userVerseKey: uniqueIndex('verse_bookmarks_user_verse_key').on(table.userId, table.verseId),
      verseIdIdx: index('verse_bookmarks_verse_id').on(table.verseId),
      userIdIdx: index('verse_bookmarks_user_id').on(table.userId),
    };
  },
);

export const verseBookmarksRelations = relations(verseBookmarks, ({ one }) => {
  return {
    verse: one(verses, {
      fields: [verseBookmarks.verseId],
      references: [verses.id],
    }),
  };
});

export const verseNotes = sqliteTable(
  'verse_notes',
  {
    ...baseModel,
    verseId: text('verse_id')
      .references(() => verses.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
  },
  (table) => {
    return {
      verseIdIdx: index('verse_notes_verse_id').on(table.verseId),
      userIdIdx: index('verse_notes_user_id').on(table.userId),
    };
  },
);

export const verseNotesRelations = relations(verseNotes, ({ one }) => {
  return {
    verse: one(verses, {
      fields: [verseNotes.verseId],
      references: [verses.id],
    }),
  };
});
