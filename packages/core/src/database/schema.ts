import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import type { Metadata } from '../types/metadata';

export const aiResponses = pgTable('ai_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  aiId: text('ai_id'),
  text: text('text'),
  failed: boolean('failed').notNull().default(false),
  regenerated: boolean('regenerated').notNull().default(false),
  modelId: text('model_id', {
    enum: [
      'anthropic.claude-instant-v1',
      'anthropic.claude-v1',
      'anthropic.claude-v2',
      'anthropic.claude-v2:1',
      'unknown'
    ]
  })
    .notNull()
    .default('unknown'),
  searchQueries: jsonb('search_queries').notNull().default([]).$type<string[]>(),
  userMessageId: uuid('user_message_id')
    .notNull()
    .references(() => userMessages.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade'
    }),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
});

export const aiResponsesRelations = relations(aiResponses, ({ one, many }) => {
  return {
    user: one(users, {
      fields: [aiResponses.userId],
      references: [users.id]
    }),
    chat: one(chats, {
      fields: [aiResponses.chatId],
      references: [chats.id]
    }),
    userMessage: one(userMessages, {
      fields: [aiResponses.userMessageId],
      references: [userMessages.id]
    }),
    aiResponseReactions: many(aiResponseReactions)
  };
});

export const aiResponseReactions = pgTable(
  'ai_response_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    aiResponseId: uuid('ai_response_id')
      .notNull()
      .references(() => aiResponses.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment')
  },
  (table) => {
    return {
      aiResponseIdIdx: index('ai_response_reactions_ai_response_id').on(table.aiResponseId)
    };
  }
);

export const aiResponseReactionsRelations = relations(aiResponseReactions, ({ one }) => {
  return {
    aiResponse: one(aiResponses, {
      fields: [aiResponseReactions.aiResponseId],
      references: [aiResponses.id]
    }),
    user: one(users, {
      fields: [aiResponseReactions.userId],
      references: [users.id]
    })
  };
});

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    permissions: jsonb('permissions').notNull().default([]).$type<string[]>()
  },
  (table) => {
    return {
      nameKey: uniqueIndex('roles_name_key').on(table.name)
    };
  }
);

export const rolesRelations = relations(roles, ({ many }) => {
  return {
    users: many(users)
  };
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name'),
    email: text('email').notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    image: text('image'),
    hasCustomImage: boolean('has_custom_image').notNull().default(false),
    translation: text('translation', {
      enum: ['NIV', 'ESV', 'NKJV', 'NLT']
    })
      .notNull()
      .default('ESV')
  },
  (table) => {
    return {
      emailKey: uniqueIndex('users_email_key').on(table.email),
      stripeCustomerIdIdx: index('users_stripe_customer_id').on(table.stripeCustomerId)
    };
  }
);

export const usersRelations = relations(users, ({ many }) => {
  return {
    roles: many(roles),
    userPasswords: many(userPasswords),
    userQueryCounts: many(userQueryCounts),
    userGeneratedImages: many(userGeneratedImages),
    userGeneratedImageCounts: many(userGeneratedImageCounts),
    userMessages: many(userMessages),
    aiResponses: many(aiResponses),
    devotionReactions: many(devotionReactions),
    aiResponseReactions: many(aiResponseReactions)
  };
});

export const userPasswords = pgTable(
  'user_passwords',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    passwordHash: text('password_hash').notNull(),
    salt: text('salt').notNull().default(''),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => {
    return {
      userIdIdx: index('user_passwords_user_id').on(table.userId)
    };
  }
);

export const userPasswordsRelations = relations(userPasswords, ({ one }) => {
  return {
    user: one(users, {
      fields: [userPasswords.userId],
      references: [users.id]
    })
  };
});

export const userQueryCounts = pgTable(
  'user_query_counts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    count: integer('count').notNull().default(0),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => {
    return {
      userIdIdx: index('user_query_counts_user_id').on(table.userId)
    };
  }
);

export const userQueryCountsRelations = relations(userQueryCounts, ({ one }) => {
  return {
    user: one(users, {
      fields: [userQueryCounts.userId],
      references: [users.id]
    })
  };
});

export const devotions = pgTable(
  'devotions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    topic: text('topic').notNull().default('general'),
    bibleReading: text('bible_reading').notNull(),
    summary: text('summary').notNull(),
    reflection: text('reflection'),
    prayer: text('prayer'),
    diveDeeperQueries: jsonb('dive_deeper_queries').notNull().default([]).$type<string[]>(),
    failed: boolean('failed').notNull().default(false)
  },
  (table) => {
    return {
      createdAtIdx: index('devotions_created_at_idx').on(table.createdAt)
    };
  }
);

export const devotionsRelations = relations(devotions, ({ many }) => {
  return {
    images: many(devotionImages),
    reactions: many(devotionReactions)
  };
});

export const devotionReactions = pgTable(
  'devotion_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    devotionId: uuid('devotion_id')
      .notNull()
      .references(() => devotions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    reaction: text('reaction', { enum: ['LIKE', 'DISLIKE'] }).notNull(),
    comment: text('comment')
  },
  (table) => {
    return {
      devotionIdIdx: index('devotion_reactions_devotion_id').on(table.devotionId)
    };
  }
);

export const devotionReactionsRelations = relations(devotionReactions, ({ one }) => {
  return {
    devotion: one(devotions, {
      fields: [devotionReactions.devotionId],
      references: [devotions.id]
    }),
    user: one(users, {
      fields: [devotionReactions.userId],
      references: [users.id]
    })
  };
});

export const devotionImages = pgTable(
  'devotion_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    devotionId: uuid('devotion_id')
      .notNull()
      .references(() => devotions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    url: text('url').notNull(),
    caption: text('caption'),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt')
  },
  (table) => {
    return {
      devotionIdIdx: index('devotion_images_devotion_id').on(table.devotionId)
    };
  }
);

export const devotionImagesRelations = relations(devotionImages, ({ one }) => {
  return {
    devotion: one(devotions, {
      fields: [devotionImages.devotionId],
      references: [devotions.id]
    })
  };
});

export const userMessages = pgTable(
  'user_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    aiId: text('ai_id'),
    text: text('text').notNull(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => {
    return {
      aiIdIdx: index('ai_id').on(table.aiId),
      textIdx: index('text').on(table.text)
    };
  }
);

export const userMessagesRelations = relations(userMessages, ({ one, many }) => {
  return {
    chat: one(chats, {
      fields: [userMessages.chatId],
      references: [chats.id]
    }),
    user: one(users, {
      fields: [userMessages.userId],
      references: [users.id]
    }),
    aiResponses: many(aiResponses)
  };
});

export const indexOperations = pgTable(
  'index_operations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status', {
      enum: ['FAILED', 'SUCCEEDED', 'RUNNING', 'COMPLETED']
    }).notNull(),
    errorMessages: jsonb('error_messages').notNull().default([]).$type<string[]>(),
    metadata: jsonb('metadata').$type<unknown>().default({}).notNull(),
    dataSourceId: uuid('data_source_id')
      .notNull()
      .references(() => dataSources.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      })
  },
  (table) => {
    return {
      statusIdx: index('index_operation_status').on(table.status)
    };
  }
);

export const indexOperationsRelations = relations(indexOperations, ({ one }) => {
  return {
    dataSource: one(dataSources, {
      fields: [indexOperations.dataSourceId],
      references: [dataSources.id]
    })
  };
});

export const chats = pgTable(
  'chats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull().default('New Chat'),
    customName: boolean('custom_name').notNull().default(false),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => {
    return {
      nameIdx: index('chat_name').on(table.name)
    };
  }
);

export const chatsRelations = relations(chats, ({ one, many }) => {
  return {
    user: one(users, {
      fields: [chats.userId],
      references: [users.id]
    }),
    userMessages: many(userMessages),
    aiResponses: many(aiResponses)
  };
});

export const aiResponsesToSourceDocuments = pgTable(
  'ai_responses_to_source_documents',
  {
    aiResponseId: uuid('ai_response_id')
      .notNull()
      .references(() => aiResponses.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    sourceDocumentId: uuid('source_document_id').notNull(),
    distance: doublePrecision('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct']
    })
      .notNull()
      .default('cosine')
  },
  (table) => {
    return {
      aiResponseSourceDocumentKey: uniqueIndex('ai_response_source_document_key').on(
        table.aiResponseId,
        table.sourceDocumentId
      )
    };
  }
);

export const devotionsToSourceDocuments = pgTable(
  'devotions_to_source_documents',
  {
    devotionId: uuid('devotion_id')
      .notNull()
      .references(() => devotions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    sourceDocumentId: uuid('source_document_id').notNull(),
    distance: doublePrecision('distance').notNull().default(0),
    distanceMetric: text('distance_metric', {
      enum: ['cosine', 'l2', 'innerProduct']
    })
      .notNull()
      .default('cosine')
  },
  (table) => {
    return {
      devotionSourceDocumentKey: uniqueIndex('devotion_source_document_key').on(
        table.devotionId,
        table.sourceDocumentId
      )
    };
  }
);

export const usersToRoles = pgTable(
  'users_to_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => {
    return {
      userRoleKey: uniqueIndex('user_role_key').on(table.userId, table.roleId)
    };
  }
);

export const userGeneratedImages = pgTable(
  'user_generated_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    url: text('url'),
    userPrompt: text('user_prompt').notNull(),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt'),
    failed: boolean('failed').notNull().default(false)
  },
  (table) => {
    return {
      userIdIdx: index('user_generated_images_user_id').on(table.userId)
    };
  }
);

export const userGeneratedImagesRelations = relations(userGeneratedImages, ({ one }) => {
  return {
    user: one(users, {
      fields: [userGeneratedImages.userId],
      references: [users.id]
    })
  };
});

export const userGeneratedImageCounts = pgTable(
  'user_generated_image_counts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    count: integer('count').notNull().default(0),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' })
  },
  (table) => {
    return {
      userIdIdx: index('user_generated_images_counts_user_id').on(table.userId)
    };
  }
);

export const userGeneratedImageCountsRelations = relations(userGeneratedImageCounts, ({ one }) => {
  return {
    user: one(users, {
      fields: [userGeneratedImageCounts.userId],
      references: [users.id]
    })
  };
});

export const dataSources = pgTable(
  'data_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: text('type', {
      enum: ['WEB_CRAWL', 'FILE', 'WEBPAGE', 'REMOTE_FILE', 'YOUTUBE']
    }).notNull(),
    metadata: jsonb('metadata').$type<Metadata>().default({}).notNull(),
    numberOfDocuments: integer('number_of_documents').notNull().default(0),
    syncSchedule: text('sync_schedule', {
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'NEVER']
    })
      .notNull()
      .default('NEVER'),
    lastManualSync: timestamp('last_manual_sync', { withTimezone: true }),
    lastAutomaticSync: timestamp('last_automatic_sync', { withTimezone: true })
  },
  (table) => {
    return {
      nameKey: uniqueIndex('data_sources_name_key').on(table.name),
      typeIdx: index('data_sources_type').on(table.type)
    };
  }
);

export const dataSourcesRelations = relations(dataSources, ({ many }) => {
  return {
    indexOperations: many(indexOperations)
  };
});
