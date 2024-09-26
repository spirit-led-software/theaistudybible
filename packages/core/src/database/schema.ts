import type { Content } from '@/schemas/bibles/contents';
import type { Metadata } from '@/schemas/utils/metadata';
import type { FinishReason, JSONValue, ToolInvocation } from 'ai';
import { add, formatISO, parseISO } from 'date-fns';
import { relations } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import {
  customType,
  foreignKey,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { DEFAULT_CREDITS } from '../utils/credits/default';
import { createId } from '../utils/id';

const timestamp = customType<{
  data: Date;
  driverData: string;
}>({
  dataType: () => 'text',
  toDriver: (value) => formatISO(value),
  fromDriver: (value) => parseISO(value),
});

const baseModel = {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

export const users = sqliteTable('users', {
  ...baseModel,
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  image: text('image'),
  stripeCustomerId: text('stripe_customer_id'),
  preferredBibleId: text('preferred_bible_id').references(() => bibles.id),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  passwords: many(passwords),
  forgottenPasswordCodes: many(forgottenPasswordCodes),
  sessions: many(sessions),
  userCredits: many(userCredits),
  usersToRoles: many(usersToRoles),
  chats: many(chats),
  messages: many(messages),
  messageReactions: many(messageReactions),
  userGeneratedImages: many(userGeneratedImages),
  userGeneratedImagesReactions: many(userGeneratedImagesReactions),
  devotionReactions: many(devotionReactions),
  preferredBible: one(bibles, {
    fields: [users.preferredBibleId],
    references: [bibles.id],
  }),
  chapterBookmarks: many(chapterBookmarks),
  chapterNotes: many(chapterNotes),
  verseHighlights: many(verseHighlights),
  verseBookmarks: many(verseBookmarks),
  verseNotes: many(verseNotes),
}));

export const passwords = sqliteTable('passwords', {
  ...baseModel,
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  hash: text('hash').notNull(),
  salt: text('salt').notNull(),
});

export const passwordsRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

export const forgottenPasswordCodes = sqliteTable('forgotten_password_codes', {
  ...baseModel,
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: text('code')
    .notNull()
    .$defaultFn(() => createId()),
  expiresAt: timestamp('expires_at')
    .notNull()
    .$defaultFn(() => add(new Date(), { hours: 1 })),
});

export const forgottenPasswordCodesRelations = relations(forgottenPasswordCodes, ({ one }) => ({
  user: one(users, {
    fields: [forgottenPasswordCodes.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userCredits = sqliteTable(
  'user_credits',
  {
    ...baseModel,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    balance: integer('balance')
      .notNull()
      .$defaultFn(() => DEFAULT_CREDITS),
    lastReadingCreditAt: timestamp('last_reading_credit_at'),
  },
  (table) => ({
    userIdIdx: uniqueIndex('user_credits_user_id_idx').on(table.userId),
  }),
);

export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
}));

export const roles = sqliteTable(
  'roles',
  {
    ...baseModel,
    name: text('name').notNull(),
  },
  (table) => ({
    nameIdx: index('roles_name_idx').on(table.name),
  }),
);

export const rolesRelations = relations(roles, ({ many }) => ({
  usersToRoles: many(usersToRoles),
}));

export const usersToRoles = sqliteTable(
  'users_to_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
);

export const usersToRolesRelations = relations(usersToRoles, ({ one }) => ({
  user: one(users, {
    fields: [usersToRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersToRoles.roleId],
    references: [roles.id],
  }),
}));

export const chats = sqliteTable(
  'chats',
  {
    ...baseModel,
    name: text('name').notNull().default('New Chat'),
    customName: integer('custom_name', { mode: 'boolean' }).notNull().default(false),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      nameIdx: index('chat_name').on(table.name),
      userIdIdx: index('chat_user_id').on(table.userId),
    };
  },
);

export const chatsRelations = relations(chats, ({ one, many }) => {
  return {
    user: one(users, {
      fields: [chats.userId],
      references: [users.id],
    }),
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
    content: text('content').default(''),
    tool_call_id: text('tool_call_id'),
    role: text('role', {
      enum: ['system', 'user', 'assistant', 'data'],
    }).notNull(),
    data: text('data', { mode: 'json' }).$type<JSONValue>(),
    annotations: text('annotations', { mode: 'json' }).$type<JSONValue[]>(),
    toolInvocations: text('tool_invocations', { mode: 'json' }).$type<ToolInvocation[]>(),
    finishReason: text('finish_reason').$type<FinishReason>(),

    // Custom fields
    anonymous: integer('anonymous', { mode: 'boolean' }).notNull().default(false),
    regenerated: integer('regenerated', { mode: 'boolean' }).notNull().default(false),

    // Relations fields
    chatId: text('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    originMessageId: text('origin_message_id').references((): AnySQLiteColumn => messages.id, {
      onDelete: 'cascade',
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
      createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
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
    user: one(users, {
      fields: [messages.userId],
      references: [users.id],
    }),
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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    user: one(users, {
      fields: [messageReactions.userId],
      references: [users.id],
    }),
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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
      createdAtIdx: index('user_generated_images_created_at_idx').on(table.createdAt),
    };
  },
);

export const userGeneratedImagesRelations = relations(userGeneratedImages, ({ one, many }) => {
  return {
    user: one(users, {
      fields: [userGeneratedImages.userId],
      references: [users.id],
    }),
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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
      user: one(users, {
        fields: [userGeneratedImagesReactions.userId],
        references: [users.id],
      }),
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
    reflection: text('reflection').notNull(),
    prayer: text('prayer').notNull(),
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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => {
    return {
      devotionIdIdx: index('devotion_reactions_devotion_id').on(table.devotionId),
      userIdIdx: index('devotion_reactions_user_id').on(table.userId),
    };
  },
);

export const devotionReactionsRelations = relations(devotionReactions, ({ one }) => {
  return {
    user: one(users, {
      fields: [devotionReactions.userId],
      references: [users.id],
    }),
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
      lastManualSyncIdx: index('data_sources_last_manual_sync_idx').on(table.lastManualSync),
      lastAutomaticSyncIdx: index('data_sources_last_automatic_sync_idx').on(
        table.lastAutomaticSync,
      ),
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
    copyrightStatement: text('copyright_statement').notNull(),
  },
  (table) => {
    return {
      abbreviationIdx: index('bibles_abbreviation').on(table.abbreviation),
    };
  },
);

export const biblesRelations = relations(bibles, ({ many }) => {
  return {
    usersWhoPreferred: many(users),
    biblesToLanguages: many(biblesToLanguages),
    biblesToCountries: many(biblesToCountries),
    biblesToRightsHolders: many(biblesToRightsHolders),
    biblesToRightsAdmins: many(biblesToRightsAdmins),
    biblesToContributors: many(biblesToContributors),
    books: many(books),
    chapters: many(chapters),
    verses: many(verses),
  };
});

export const bibleLanguages = sqliteTable('bible_languages', {
  ...baseModel,
  iso: text('iso').notNull().unique(),
  name: text('name').notNull(),
  nameLocal: text('name_local').notNull(),
  script: text('script').notNull(),
  scriptCode: text('script_code').notNull(),
  scriptDirection: text('script_direction', { enum: ['LTR', 'RTL'] }).notNull(),
  ldml: text('ldml').notNull(),
  rod: integer('rod'),
  numerals: text('numerals').notNull(),
});

export const bibleLanguagesRelations = relations(bibleLanguages, ({ many }) => {
  return {
    biblesToLanguages: many(biblesToLanguages),
  };
});

export const biblesToLanguages = sqliteTable(
  'bibles_to_languages',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    languageId: text('language_id')
      .references(() => bibleLanguages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    bibleLanguageKey: uniqueIndex('bibles_to_languages_key').on(table.bibleId, table.languageId),
  }),
);

export const biblesToLanguagesRelations = relations(biblesToLanguages, ({ one }) => {
  return {
    bible: one(bibles, {
      fields: [biblesToLanguages.bibleId],
      references: [bibles.id],
    }),
    language: one(bibleLanguages, {
      fields: [biblesToLanguages.languageId],
      references: [bibleLanguages.id],
    }),
  };
});

export const bibleCountries = sqliteTable('bible_countries', {
  ...baseModel,
  iso: text('iso').notNull().unique(),
  name: text('name').notNull(),
});

export const bibleCountriesRelations = relations(bibleCountries, ({ many }) => {
  return {
    biblesToCountries: many(biblesToCountries),
  };
});

export const biblesToCountries = sqliteTable(
  'bibles_to_countries',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    countryId: text('country_id')
      .references(() => bibleCountries.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    bibleCountryKey: uniqueIndex('bibles_to_countries_key').on(table.bibleId, table.countryId),
  }),
);

export const biblesToCountriesRelations = relations(biblesToCountries, ({ one }) => {
  return {
    bible: one(bibles, {
      fields: [biblesToCountries.bibleId],
      references: [bibles.id],
    }),
    country: one(bibleCountries, {
      fields: [biblesToCountries.countryId],
      references: [bibleCountries.id],
    }),
  };
});

export const bibleRightsHolders = sqliteTable('bible_rights_holders', {
  ...baseModel,
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  nameLocal: text('name_local').notNull(),
  abbr: text('abbr').notNull(),
  url: text('url').notNull(),
});

export const bibleRightsHoldersRelations = relations(bibleRightsHolders, ({ many }) => {
  return {
    biblesToRightsHolders: many(biblesToRightsHolders),
  };
});

export const biblesToRightsHolders = sqliteTable(
  'bibles_to_rights_holders',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    rightsHolderId: text('rights_holder_id')
      .references(() => bibleRightsHolders.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    bibleRightsHolderKey: uniqueIndex('bible_rights_holders_to_bibles_key').on(
      table.bibleId,
      table.rightsHolderId,
    ),
  }),
);

export const biblesToRightsHoldersRelations = relations(biblesToRightsHolders, ({ one }) => {
  return {
    bible: one(bibles, {
      fields: [biblesToRightsHolders.bibleId],
      references: [bibles.id],
    }),
    rightsHolder: one(bibleRightsHolders, {
      fields: [biblesToRightsHolders.rightsHolderId],
      references: [bibleRightsHolders.id],
    }),
  };
});

export const bibleRightsAdmins = sqliteTable('bible_rights_admins', {
  ...baseModel,
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  url: text('url'),
});

export const bibleRightsAdminsRelations = relations(bibleRightsAdmins, ({ many }) => {
  return {
    biblesToRightsAdmins: many(biblesToRightsAdmins),
  };
});

export const biblesToRightsAdmins = sqliteTable(
  'bibles_to_rights_admins',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    rightsAdminId: text('rights_admin_id')
      .references(() => bibleRightsAdmins.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    bibleRightsAdminKey: uniqueIndex('bibles_to_rights_admins_key').on(
      table.bibleId,
      table.rightsAdminId,
    ),
  }),
);

export const biblesToRightsAdminsRelations = relations(biblesToRightsAdmins, ({ one }) => {
  return {
    bible: one(bibles, {
      fields: [biblesToRightsAdmins.bibleId],
      references: [bibles.id],
    }),
    rightsAdmin: one(bibleRightsAdmins, {
      fields: [biblesToRightsAdmins.rightsAdminId],
      references: [bibleRightsAdmins.id],
    }),
  };
});

export const bibleContributors = sqliteTable('bible_contributors', {
  ...baseModel,
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  content: integer('content', { mode: 'boolean' }).notNull().default(false),
  publication: integer('publication', { mode: 'boolean' }).notNull().default(false),
  management: integer('management', { mode: 'boolean' }).notNull().default(false),
  finance: integer('finance', { mode: 'boolean' }).notNull().default(false),
  qa: integer('qa', { mode: 'boolean' }).notNull().default(false),
});

export const bibleContributorsRelations = relations(bibleContributors, ({ many }) => {
  return {
    biblesToContributors: many(biblesToContributors),
  };
});

export const biblesToContributors = sqliteTable(
  'bibles_to_contributors',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    contributorId: text('contributor_id')
      .references(() => bibleContributors.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    bibleContributorKey: uniqueIndex('bibles_to_contributors_key').on(
      table.bibleId,
      table.contributorId,
    ),
  }),
);

export const biblesToContributorsRelations = relations(biblesToContributors, ({ one }) => {
  return {
    bible: one(bibles, {
      fields: [biblesToContributors.bibleId],
      references: [bibles.id],
    }),
    contributor: one(bibleContributors, {
      fields: [biblesToContributors.contributorId],
      references: [bibleContributors.id],
    }),
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
    code: text('code').notNull(),
    abbreviation: text('abbreviation'),
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
    code: text('code').notNull(),
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
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    user: one(users, {
      fields: [chapterBookmarks.userId],
      references: [users.id],
    }),
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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    user: one(users, {
      fields: [chapterNotes.userId],
      references: [users.id],
    }),
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

export const readingSessions = sqliteTable(
  'reading_sessions',
  {
    ...baseModel,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
  },
  (table) => ({
    userIdIdx: index('reading_sessions_user_id_idx').on(table.userId),
    startTimeIdx: index('reading_sessions_start_time_idx').on(table.startTime),
    endTimeIdx: index('reading_sessions_end_time_idx').on(table.endTime),
  }),
);

export const readingSessionsRelations = relations(readingSessions, ({ one }) => {
  return {
    user: one(users, {
      fields: [readingSessions.userId],
      references: [users.id],
    }),
  };
});

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
    code: text('code').notNull(),
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
      .references(() => verses.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    user: one(users, {
      fields: [verseHighlights.userId],
      references: [users.id],
    }),
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
      .references(() => verses.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    user: one(users, {
      fields: [verseBookmarks.userId],
      references: [users.id],
    }),
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
      .references(() => verses.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    user: one(users, {
      fields: [verseNotes.userId],
      references: [users.id],
    }),
    verse: one(verses, {
      fields: [verseNotes.verseId],
      references: [verses.id],
    }),
  };
});
