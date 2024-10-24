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

export const users = sqliteTable(
  'users',
  {
    ...baseModel,
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    image: text('image'),
    stripeCustomerId: text('stripe_customer_id'),
    preferredBibleId: text('preferred_bible_id').references(() => bibles.id),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    stripeCustomerIdIdx: index('users_stripe_customer_id_idx').on(table.stripeCustomerId),
    preferredBibleIdx: index('users_preferred_bible_id_idx').on(table.preferredBibleId),
  }),
);

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

export const passwords = sqliteTable(
  'passwords',
  {
    ...baseModel,
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hash: text('hash').notNull(),
    salt: text('salt').notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('passwords_user_id_idx').on(table.userId),
  }),
);

export const passwordsRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

export const forgottenPasswordCodes = sqliteTable(
  'forgotten_password_codes',
  {
    ...baseModel,
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code')
      .notNull()
      .$defaultFn(() => createId()),
    expiresAt: timestamp('expires_at')
      .notNull()
      .$defaultFn(() => add(new Date(), { hours: 1 })),
  },
  (table) => ({
    userIdIdx: uniqueIndex('forgotten_password_codes_user_id_idx').on(table.userId),
  }),
);

export const forgottenPasswordCodesRelations = relations(forgottenPasswordCodes, ({ one }) => ({
  user: one(users, {
    fields: [forgottenPasswordCodes.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
  }),
);

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
      .$defaultFn(() => 10),
    lastSignInCreditAt: timestamp('last_sign_in_credit_at'),
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
    userIdIdx: index('users_to_roles_user_id_idx').on(table.userId),
    roleIdIdx: index('users_to_roles_role_id_idx').on(table.roleId),
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
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('New Chat'),
    customName: integer('custom_name', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => ({
    userIdIdx: index('chats_user_id_idx').on(table.userId),
    nameIdx: index('chats_name_idx').on(table.name),
  }),
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  shareOptions: one(shareChatOptions),
}));

export const shareChatOptions = sqliteTable(
  'share_chat_options',
  {
    ...baseModel,
    chatId: text('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    chatIdIdx: uniqueIndex('chat_share_options_chat_id_idx').on(table.chatId),
  }),
);

export const shareChatOptionsRelations = relations(shareChatOptions, ({ one }) => ({
  chat: one(chats, {
    fields: [shareChatOptions.chatId],
    references: [chats.id],
  }),
}));

export const messages = sqliteTable(
  'messages',
  {
    ...baseModel,
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

    // Fields required by the ai sdk
    content: text('content'),
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
  },
  (table) => ({
    chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
    userIdIdx: index('messages_user_id_idx').on(table.userId),
    originMessageIdIdx: index('messages_origin_message_id_idx').on(table.originMessageId),
    originMessageReference: foreignKey({
      columns: [table.originMessageId],
      foreignColumns: [table.id],
      name: 'origin_message_reference',
    }).onDelete('cascade'),
    roleIdx: index('messages_role_idx').on(table.role),
    contentIdx: index('messages_content_idx').on(table.content),
    finishReasonIdx: index('messages_finish_reason_idx').on(table.finishReason),
  }),
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
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
}));

export const messageReactions = sqliteTable(
  'message_reactions',
  {
    ...baseModel,
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => ({
    uniqueUserIdx: uniqueIndex('message_reactions_unique_user_idx').on(
      table.messageId,
      table.userId,
    ),
    messageIdIdx: index('message_reactions_message_id_idx').on(table.messageId),
    userIdIdx: index('message_reactions_user_id_idx').on(table.userId),
  }),
);

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
}));

export const messagesToSourceDocuments = sqliteTable(
  'messages_to_source_documents',
  {
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    sourceDocumentId: text('source_document_id').notNull(),
    distance: real('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct'],
    })
      .notNull()
      .default('cosine'),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.messageId, table.sourceDocumentId],
    }),
    messageIdIdx: index('messages_to_source_documents_message_id_idx').on(table.messageId),
    sourceDocumentIdIdx: index('messages_to_source_documents_source_document_id_idx').on(
      table.sourceDocumentId,
    ),
  }),
);

export const messagesToSourceDocumentsRelations = relations(
  messagesToSourceDocuments,
  ({ one }) => ({
    message: one(messages, {
      fields: [messagesToSourceDocuments.messageId],
      references: [messages.id],
    }),
  }),
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
    }),
    url: text('url'),
    userPrompt: text('user_prompt').notNull(),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt'),
    searchQueries: text('search_queries', { mode: 'json' }).notNull().default([]).$type<string[]>(),
    failed: integer('failed', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => ({
    userIdIdx: index('user_generated_images_user_id_idx').on(table.userId),
    messageIdIdx: index('user_generated_images_message_id_idx').on(table.messageId),
    userPromptIdx: index('user_generated_images_user_prompt_idx').on(table.userPrompt),
    failedIdx: index('user_generated_images_failed_idx').on(table.failed),
  }),
);

export const userGeneratedImagesRelations = relations(userGeneratedImages, ({ one, many }) => ({
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
}));

export const userGeneratedImagesReactions = sqliteTable(
  'user_generated_images_reactions',
  {
    ...baseModel,
    userGeneratedImageId: text('user_generated_image_id')
      .notNull()
      .references(() => userGeneratedImages.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => ({
    userGeneratedImageReactionIdx: uniqueIndex('user_generated_image_reaction_idx').on(
      table.userGeneratedImageId,
      table.userId,
    ),
    userGeneratedImageIdIdx: index(
      'user_generated_images_reactions_user_generated_image_id_idx',
    ).on(table.userGeneratedImageId),
    userIdIdx: index('user_generated_images_reactions_user_id_idx').on(table.userId),
    reactionIdx: index('user_generated_images_reactions_reaction_idx').on(table.reaction),
  }),
);

export const userGeneratedImagesReactionsRelations = relations(
  userGeneratedImagesReactions,
  ({ one }) => ({
    user: one(users, {
      fields: [userGeneratedImagesReactions.userId],
      references: [users.id],
    }),
    userGeneratedImage: one(userGeneratedImages, {
      fields: [userGeneratedImagesReactions.userGeneratedImageId],
      references: [userGeneratedImages.id],
    }),
  }),
);

export const userGeneratedImagesToSourceDocuments = sqliteTable(
  'user_generated_images_to_source_documents',
  {
    userGeneratedImageId: text('user_generated_image_id')
      .notNull()
      .references(() => userGeneratedImages.id, { onDelete: 'cascade' }),
    sourceDocumentId: text('source_document_id').notNull(),
    distance: real('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct'],
    })
      .notNull()
      .default('cosine'),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.userGeneratedImageId, table.sourceDocumentId],
    }),
    userGeneratedImageIdIdx: index(
      'user_generated_images_to_source_documents_user_generated_image_id_idx',
    ).on(table.userGeneratedImageId),
    sourceDocumentIdIdx: index(
      'user_generated_images_to_source_documents_source_document_id_idx',
    ).on(table.sourceDocumentId),
  }),
);

export const userGeneratedImagesToSourceDocumentsRelations = relations(
  userGeneratedImagesToSourceDocuments,
  ({ one }) => ({
    userGeneratedImage: one(userGeneratedImages, {
      fields: [userGeneratedImagesToSourceDocuments.userGeneratedImageId],
      references: [userGeneratedImages.id],
    }),
  }),
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
  (table) => ({
    topicIdx: index('devotions_topic_idx').on(table.topic),
    createdAtIdx: index('devotions_created_at_idx').on(table.createdAt),
    failedIdx: index('devotions_failed_idx').on(table.failed),
  }),
);

export const devotionsRelations = relations(devotions, ({ one, many }) => ({
  images: one(devotionImages),
  reactions: many(devotionReactions),
  devotionsToSourceDocuments: many(devotionsToSourceDocuments),
}));

export const devotionReactions = sqliteTable(
  'devotion_reactions',
  {
    ...baseModel,
    devotionId: text('devotion_id')
      .notNull()
      .references(() => devotions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment'),
  },
  (table) => ({
    devotionReactionsUniqueUserIdx: uniqueIndex('devotion_reactions_unique_user_idx').on(
      table.devotionId,
      table.userId,
    ),
    devotionIdIdx: index('devotion_reactions_devotion_id_idx').on(table.devotionId),
    userIdIdx: index('devotion_reactions_user_id_idx').on(table.userId),
    reactionIdx: index('devotion_reactions_reaction_idx').on(table.reaction),
  }),
);

export const devotionReactionsRelations = relations(devotionReactions, ({ one }) => ({
  user: one(users, {
    fields: [devotionReactions.userId],
    references: [users.id],
  }),
  devotion: one(devotions, {
    fields: [devotionReactions.devotionId],
    references: [devotions.id],
  }),
}));

export const devotionImages = sqliteTable(
  'devotion_images',
  {
    ...baseModel,
    devotionId: text('devotion_id')
      .notNull()
      .references(() => devotions.id, { onDelete: 'cascade' }),
    url: text('url'),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt'),
    caption: text('caption'),
  },
  (table) => ({
    devotionIdIdx: index('devotion_images_devotion_id_idx').on(table.devotionId),
    captionIdx: index('devotion_images_caption_idx').on(table.caption),
  }),
);

export const devotionImagesRelations = relations(devotionImages, ({ one }) => ({
  devotion: one(devotions, {
    fields: [devotionImages.devotionId],
    references: [devotions.id],
  }),
}));

export const devotionsToSourceDocuments = sqliteTable(
  'devotions_to_source_documents',
  {
    devotionId: text('devotion_id')
      .notNull()
      .references(() => devotions.id, { onDelete: 'cascade' }),
    sourceDocumentId: text('source_document_id').notNull(),
    distance: real('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct'],
    })
      .notNull()
      .default('cosine'),
  },
  (table) => ({
    devotionSourceDocumentKey: primaryKey({
      columns: [table.devotionId, table.sourceDocumentId],
    }),
    devotionIdIdx: index('devotions_to_source_documents_devotion_id_idx').on(table.devotionId),
    sourceDocumentIdIdx: index('devotions_to_source_documents_source_document_id_idx').on(
      table.sourceDocumentId,
    ),
  }),
);

export const devotionsToSourceDocumentsRelations = relations(
  devotionsToSourceDocuments,
  ({ one }) => ({
    devotion: one(devotions, {
      fields: [devotionsToSourceDocuments.devotionId],
      references: [devotions.id],
    }),
  }),
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
  (table) => ({
    nameKey: uniqueIndex('data_sources_name_key').on(table.name),
    typeIdx: index('data_sources_type_idx').on(table.type),
    metadataIdx: index('data_sources_metadata_idx').on(table.metadata),
    lastManualSyncIdx: index('data_sources_last_manual_sync_idx').on(table.lastManualSync),
    lastAutomaticSyncIdx: index('data_sources_last_automatic_sync_idx').on(table.lastAutomaticSync),
  }),
);

export const dataSourcesRelations = relations(dataSources, ({ many }) => ({
  indexOperations: many(indexOperations),
  dataSourcesToSourceDocuments: many(dataSourcesToSourceDocuments),
}));

export const dataSourcesToSourceDocuments = sqliteTable(
  'data_sources_to_source_documents',
  {
    dataSourceId: text('data_source_id')
      .notNull()
      .references(() => dataSources.id, { onDelete: 'cascade' }),
    sourceDocumentId: text('source_document_id').notNull(),
  },
  (table) => ({
    dataSourceSourceDocumentKey: primaryKey({
      columns: [table.dataSourceId, table.sourceDocumentId],
    }),
    dataSourceIdIdx: index('data_sources_to_source_documents_data_source_id_idx').on(
      table.dataSourceId,
    ),
    sourceDocumentIdIdx: index('data_sources_to_source_documents_source_document_id_idx').on(
      table.sourceDocumentId,
    ),
  }),
);

export const dataSourcesToSourceDocumentsRelations = relations(
  dataSourcesToSourceDocuments,
  ({ one }) => ({
    dataSource: one(dataSources, {
      fields: [dataSourcesToSourceDocuments.dataSourceId],
      references: [dataSources.id],
    }),
  }),
);

export const indexOperations = sqliteTable(
  'index_operations',
  {
    ...baseModel,
    dataSourceId: text('data_source_id')
      .notNull()
      .references(() => dataSources.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['FAILED', 'SUCCEEDED', 'RUNNING', 'COMPLETED'],
    }).notNull(),
    metadata: text('metadata', { mode: 'json' }).notNull().default({}).$type<Metadata>(),
    errorMessages: text('error_messages', { mode: 'json' }).notNull().default([]).$type<string[]>(),
  },
  (table) => ({
    dataSourceIdIdx: index('index_operation_data_source_id_idx').on(table.dataSourceId),
    statusIdx: index('index_operation_status_idx').on(table.status),
    metadataIdx: index('index_operation_metadata_idx').on(table.metadata),
  }),
);

export const indexOperationsRelations = relations(indexOperations, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [indexOperations.dataSourceId],
    references: [dataSources.id],
  }),
}));

export const bibles = sqliteTable(
  'bibles',
  {
    ...baseModel,
    abbreviation: text('abbreviation').notNull(),
    abbreviationLocal: text('abbreviation_local').notNull(),
    name: text('name').notNull(),
    nameLocal: text('name_local').notNull(),
    description: text('description').notNull(),
    copyrightStatement: text('copyright_statement').notNull(),
  },
  (table) => ({
    abbreviationIdx: uniqueIndex('bibles_abbreviation_idx').on(table.abbreviation),
    abbreviationLocalIdx: index('bibles_abbreviation_local_idx').on(table.abbreviationLocal),
    nameIdx: index('bibles_name_idx').on(table.name),
    nameLocalIdx: index('bibles_name_local_idx').on(table.nameLocal),
  }),
);

export const biblesRelations = relations(bibles, ({ many }) => ({
  usersWhoPreferred: many(users),
  biblesToLanguages: many(biblesToLanguages),
  biblesToCountries: many(biblesToCountries),
  biblesToRightsHolders: many(biblesToRightsHolders),
  biblesToRightsAdmins: many(biblesToRightsAdmins),
  biblesToContributors: many(biblesToContributors),
  books: many(books),
  chapters: many(chapters),
  verses: many(verses),
}));

export const bibleLanguages = sqliteTable(
  'bible_languages',
  {
    ...baseModel,
    iso: text('iso').notNull(),
    name: text('name').notNull(),
    nameLocal: text('name_local').notNull(),
    script: text('script').notNull(),
    scriptCode: text('script_code').notNull(),
    scriptDirection: text('script_direction', { enum: ['LTR', 'RTL'] }).notNull(),
    ldml: text('ldml').notNull(),
    rod: integer('rod'),
    numerals: text('numerals').notNull(),
  },
  (table) => ({
    isoIdx: uniqueIndex('bible_languages_iso_idx').on(table.iso),
    nameIdx: index('bible_languages_name_idx').on(table.name),
    nameLocalIdx: index('bible_languages_name_local_idx').on(table.nameLocal),
    scriptCodeIdx: index('bible_languages_script_code_idx').on(table.scriptCode),
    scriptDirectionIdx: index('bible_languages_script_direction_idx').on(table.scriptDirection),
  }),
);

export const bibleLanguagesRelations = relations(bibleLanguages, ({ many }) => ({
  biblesToLanguages: many(biblesToLanguages),
}));

export const biblesToLanguages = sqliteTable(
  'bibles_to_languages',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    languageId: text('language_id')
      .references(() => bibleLanguages.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.bibleId, table.languageId] }),
    bibleIdIdx: index('bibles_to_languages_bible_id_idx').on(table.bibleId),
    languageIdIdx: index('bibles_to_languages_language_id_idx').on(table.languageId),
  }),
);

export const biblesToLanguagesRelations = relations(biblesToLanguages, ({ one }) => ({
  bible: one(bibles, {
    fields: [biblesToLanguages.bibleId],
    references: [bibles.id],
  }),
  language: one(bibleLanguages, {
    fields: [biblesToLanguages.languageId],
    references: [bibleLanguages.id],
  }),
}));

export const bibleCountries = sqliteTable(
  'bible_countries',
  {
    ...baseModel,
    iso: text('iso').notNull(),
    name: text('name').notNull(),
  },
  (table) => ({
    isoIdx: uniqueIndex('bible_countries_iso_idx').on(table.iso),
  }),
);

export const bibleCountriesRelations = relations(bibleCountries, ({ many }) => ({
  biblesToCountries: many(biblesToCountries),
}));

export const biblesToCountries = sqliteTable(
  'bibles_to_countries',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    countryId: text('country_id')
      .references(() => bibleCountries.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.bibleId, table.countryId] }),
    bibleIdIdx: index('bibles_to_countries_bible_id_idx').on(table.bibleId),
    countryIdIdx: index('bibles_to_countries_country_id_idx').on(table.countryId),
  }),
);

export const biblesToCountriesRelations = relations(biblesToCountries, ({ one }) => ({
  bible: one(bibles, {
    fields: [biblesToCountries.bibleId],
    references: [bibles.id],
  }),
  country: one(bibleCountries, {
    fields: [biblesToCountries.countryId],
    references: [bibleCountries.id],
  }),
}));

export const bibleRightsHolders = sqliteTable(
  'bible_rights_holders',
  {
    ...baseModel,
    uid: text('uid').notNull(),
    name: text('name').notNull(),
    nameLocal: text('name_local').notNull(),
    abbr: text('abbr').notNull(),
    url: text('url').notNull(),
  },
  (table) => ({
    uidIdx: uniqueIndex('bible_rights_holders_uid_idx').on(table.uid),
    abbrIdx: index('bible_rights_holders_abbr_idx').on(table.abbr),
  }),
);

export const bibleRightsHoldersRelations = relations(bibleRightsHolders, ({ many }) => ({
  biblesToRightsHolders: many(biblesToRightsHolders),
}));

export const biblesToRightsHolders = sqliteTable(
  'bibles_to_rights_holders',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    rightsHolderId: text('rights_holder_id')
      .references(() => bibleRightsHolders.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.bibleId, table.rightsHolderId],
    }),
    bibleIdIdx: index('bibles_to_rights_holders_bible_id_idx').on(table.bibleId),
    rightsHolderIdIdx: index('bibles_to_rights_holders_rights_holder_id_idx').on(
      table.rightsHolderId,
    ),
  }),
);

export const biblesToRightsHoldersRelations = relations(biblesToRightsHolders, ({ one }) => ({
  bible: one(bibles, {
    fields: [biblesToRightsHolders.bibleId],
    references: [bibles.id],
  }),
  rightsHolder: one(bibleRightsHolders, {
    fields: [biblesToRightsHolders.rightsHolderId],
    references: [bibleRightsHolders.id],
  }),
}));

export const bibleRightsAdmins = sqliteTable(
  'bible_rights_admins',
  {
    ...baseModel,
    uid: text('uid').notNull(),
    name: text('name').notNull(),
    url: text('url'),
  },
  (table) => ({
    uidIdx: uniqueIndex('bible_rights_admins_uid_idx').on(table.uid),
  }),
);

export const bibleRightsAdminsRelations = relations(bibleRightsAdmins, ({ many }) => ({
  biblesToRightsAdmins: many(biblesToRightsAdmins),
}));

export const biblesToRightsAdmins = sqliteTable(
  'bibles_to_rights_admins',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    rightsAdminId: text('rights_admin_id')
      .references(() => bibleRightsAdmins.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.bibleId, table.rightsAdminId],
    }),
    bibleIdIdx: index('bibles_to_rights_admins_bible_id_idx').on(table.bibleId),
    rightsAdminIdIdx: index('bibles_to_rights_admins_rights_admin_id_idx').on(table.rightsAdminId),
  }),
);

export const biblesToRightsAdminsRelations = relations(biblesToRightsAdmins, ({ one }) => ({
  bible: one(bibles, {
    fields: [biblesToRightsAdmins.bibleId],
    references: [bibles.id],
  }),
  rightsAdmin: one(bibleRightsAdmins, {
    fields: [biblesToRightsAdmins.rightsAdminId],
    references: [bibleRightsAdmins.id],
  }),
}));

export const bibleContributors = sqliteTable(
  'bible_contributors',
  {
    ...baseModel,
    uid: text('uid').notNull(),
    name: text('name').notNull(),
    content: integer('content', { mode: 'boolean' }).notNull().default(false),
    publication: integer('publication', { mode: 'boolean' }).notNull().default(false),
    management: integer('management', { mode: 'boolean' }).notNull().default(false),
    finance: integer('finance', { mode: 'boolean' }).notNull().default(false),
    qa: integer('qa', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => ({
    uidIdx: uniqueIndex('bible_contributors_uid_idx').on(table.uid),
  }),
);

export const bibleContributorsRelations = relations(bibleContributors, ({ many }) => ({
  biblesToContributors: many(biblesToContributors),
}));

export const biblesToContributors = sqliteTable(
  'bibles_to_contributors',
  {
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    contributorId: text('contributor_id')
      .references(() => bibleContributors.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.bibleId, table.contributorId],
    }),
    bibleIdIdx: index('bibles_to_contributors_bible_id_idx').on(table.bibleId),
    contributorIdIdx: index('bibles_to_contributors_contributor_id_idx').on(table.contributorId),
  }),
);

export const biblesToContributorsRelations = relations(biblesToContributors, ({ one }) => ({
  bible: one(bibles, {
    fields: [biblesToContributors.bibleId],
    references: [bibles.id],
  }),
  contributor: one(bibleContributors, {
    fields: [biblesToContributors.contributorId],
    references: [bibleContributors.id],
  }),
}));

export const books = sqliteTable(
  'books',
  {
    ...baseModel,
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    previousId: text('previous_id'),
    nextId: text('next_id'),
    number: integer('number').notNull(),
    code: text('code').notNull(),
    abbreviation: text('abbreviation'),
    shortName: text('short_name').notNull(),
    longName: text('long_name').notNull(),
  },
  (table) => ({
    bibleIdIdx: index('books_bible_id_idx').on(table.bibleId),
    previousIdIdx: index('books_previous_id_idx').on(table.previousId),
    nextIdIdx: index('books_next_id_idx').on(table.nextId),
    numberIdx: index('books_number_idx').on(table.number),
    codeIdx: index('books_code_idx').on(table.code),
    abbreviationIdx: index('books_abbreviation_idx').on(table.abbreviation),
  }),
);

export const booksRelations = relations(books, ({ one, many }) => ({
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
}));

export const chapters = sqliteTable(
  'chapters',
  {
    ...baseModel,
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    bookId: text('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    previousId: text('previous_id'),
    nextId: text('next_id'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    number: integer('number').notNull(),
    content: text('content', { mode: 'json' }).notNull().$type<Content[]>(),
  },
  (table) => ({
    bibleIdIdx: index('chapters_bible_id_idx').on(table.bibleId),
    bookIdIdx: index('chapters_book_id_idx').on(table.bookId),
    previousIdIdx: index('chapters_previous_id_idx').on(table.previousId),
    nextIdIdx: index('chapters_next_id_idx').on(table.nextId),
    codeIdx: index('chapters_code_idx').on(table.code),
    nameIdx: index('chapters_name_idx').on(table.name),
    numberIdx: index('chapters_number_idx').on(table.number),
  }),
);

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
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
}));

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
  (table) => ({
    uniqueUserChapter: uniqueIndex('chapter_bookmarks_unique_user_chapter_idx').on(
      table.chapterId,
      table.userId,
    ),
    chapterIdIdx: index('chapter_bookmarks_chapter_id_idx').on(table.chapterId),
    userIdIdx: index('chapter_bookmarks_user_id_idx').on(table.userId),
  }),
);

export const chapterBookmarksRelations = relations(chapterBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [chapterBookmarks.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [chapterBookmarks.chapterId],
    references: [chapters.id],
  }),
}));

export const chapterNotes = sqliteTable(
  'chapter_notes',
  {
    ...baseModel,
    chapterId: text('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
  },
  (table) => ({
    chapterIdIdx: index('chapter_notes_chapter_id_idx').on(table.chapterId),
    userIdIdx: index('chapter_notes_user_id_idx').on(table.userId),
  }),
);

export const chapterNotesRelations = relations(chapterNotes, ({ one }) => ({
  user: one(users, {
    fields: [chapterNotes.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [chapterNotes.chapterId],
    references: [chapters.id],
  }),
}));

export const chaptersToSourceDocuments = sqliteTable(
  'chapters_to_source_documents',
  {
    chapterId: text('chapter_id')
      .notNull()
      .references(() => chapters.id, { onDelete: 'cascade' }),
    sourceDocumentId: text('source_document_id').notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.chapterId, table.sourceDocumentId],
    }),
    chapterIdIdx: index('chapters_to_source_documents_chapter_id_idx').on(table.chapterId),
    sourceDocumentIdIdx: index('chapters_to_source_documents_source_document_id_idx').on(
      table.sourceDocumentId,
    ),
  }),
);

export const chaptersToSourceDocumentsRelations = relations(
  chaptersToSourceDocuments,
  ({ one }) => ({
    chapter: one(chapters, {
      fields: [chaptersToSourceDocuments.chapterId],
      references: [chapters.id],
    }),
  }),
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

export const readingSessionsRelations = relations(readingSessions, ({ one }) => ({
  user: one(users, {
    fields: [readingSessions.userId],
    references: [users.id],
  }),
}));

export const verses = sqliteTable(
  'verses',
  {
    ...baseModel,
    bibleId: text('bible_id')
      .references(() => bibles.id, { onDelete: 'cascade' })
      .notNull(),
    bookId: text('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterId: text('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    previousId: text('previous_id'),
    nextId: text('next_id'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    number: integer('number').notNull(),
    content: text('content', { mode: 'json' }).notNull().$type<Content[]>(),
  },
  (table) => ({
    bibleIdIdx: index('verses_bible_id_idx').on(table.bibleId),
    bookIdIdx: index('verses_book_id_idx').on(table.bookId),
    chapterIdIdx: index('verses_chapter_id_idx').on(table.chapterId),
    previousIdIdx: index('verses_previous_id_idx').on(table.previousId),
    nextIdIdx: index('verses_next_id_idx').on(table.nextId),
    codeIdx: index('verses_code_idx').on(table.code),
    nameIdx: index('verses_name_idx').on(table.name),
    numberIdx: index('verses_number_idx').on(table.number),
  }),
);

export const versesRelations = relations(verses, ({ one, many }) => ({
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
}));

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
  (table) => ({
    uniqueUserVerse: uniqueIndex('verse_highlights_unique_user_verse_idx').on(
      table.userId,
      table.verseId,
    ),
    verseIdIdx: index('verse_highlights_verse_id_idx').on(table.verseId),
    userIdIdx: index('verse_highlights_user_id_idx').on(table.userId),
  }),
);

export const verseHighlightsRelations = relations(verseHighlights, ({ one }) => ({
  user: one(users, {
    fields: [verseHighlights.userId],
    references: [users.id],
  }),
  verse: one(verses, {
    fields: [verseHighlights.verseId],
    references: [verses.id],
  }),
}));

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
  (table) => ({
    uniqueUserVerse: uniqueIndex('verse_bookmarks_unique_user_verse_idx').on(
      table.userId,
      table.verseId,
    ),
    verseIdIdx: index('verse_bookmarks_verse_id_idx').on(table.verseId),
    userIdIdx: index('verse_bookmarks_user_id_idx').on(table.userId),
  }),
);

export const verseBookmarksRelations = relations(verseBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [verseBookmarks.userId],
    references: [users.id],
  }),
  verse: one(verses, {
    fields: [verseBookmarks.verseId],
    references: [verses.id],
  }),
}));

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
  (table) => ({
    verseIdIdx: index('verse_notes_verse_id_idx').on(table.verseId),
    userIdIdx: index('verse_notes_user_id_idx').on(table.userId),
  }),
);

export const verseNotesRelations = relations(verseNotes, ({ one }) => ({
  user: one(users, {
    fields: [verseNotes.userId],
    references: [users.id],
  }),
  verse: one(verses, {
    fields: [verseNotes.verseId],
    references: [verses.id],
  }),
}));
