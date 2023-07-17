import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const indexOperationType = pgEnum("index_operation_type", [
  "FILE",
  "WEBSITE",
  "WEBPAGE",
]);

export const indexOperationStatus = pgEnum("index_operation_status", [
  "FAILED",
  "COMPLETED",
  "IN_PROGRESS",
  "PENDING",
]);

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    text: text("text").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => {
    return {
      textKey: uniqueIndex("source_document_text_key").on(table.text),
      textMetadataIdx: index("source_document_text_metadata_idx").on(
        table.text,
        table.metadata
      ),
    };
  }
);

export const sourceDocumentsRelations = relations(
  sourceDocuments,
  ({ many }) => {
    return {
      aiResponses: many(aiResponses),
      devotions: many(devotions),
    };
  }
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
      identifierTokenKey: uniqueIndex(
        "verification_tokens_identifier_token_key"
      ).on(table.identifier, table.token),
      tokenKey: uniqueIndex("verification_tokens_token_key").on(table.token),
    };
  }
);

export const aiResponses = pgTable("ai_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    precision: 3,
    mode: "string",
  })
    .notNull()
    .defaultNow(),
  aiId: text("ai_id"),
  text: text("text"),
  failed: boolean("failed").notNull().default(false),
  regenerated: boolean("regenerated").notNull().default(false),
  userMessageId: text("user_message_id")
    .notNull()
    .references(() => userMessages.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const aiResponsesRelations = relations(aiResponses, ({ one, many }) => {
  return {
    user: one(users, {
      fields: [aiResponses.userId],
      references: [users.id],
    }),
    chat: one(chats, {
      fields: [aiResponses.chatId],
      references: [chats.id],
    }),
    userMessage: one(userMessages, {
      fields: [aiResponses.userMessageId],
      references: [userMessages.id],
    }),
    sourceDocuments: many(sourceDocuments),
  };
});

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    name: text("name").notNull(),
  },
  (table) => {
    return {
      nameKey: uniqueIndex("roles_name_key").on(table.name),
    };
  }
);

export const rolesRelations = relations(roles, ({ many }) => {
  return {
    users: many(users),
  };
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("email_verified", {
      precision: 3,
      mode: "string",
    }),
    image: text("image"),
  },
  (table) => {
    return {
      emailKey: uniqueIndex("users_email_key").on(table.email),
    };
  }
);

export const usersRelations = relations(users, ({ many }) => {
  return {
    roles: many(roles),
    accounts: many(accounts),
  };
});

export const devotions = pgTable("devotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { precision: 3, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    precision: 3,
    mode: "string",
  })
    .notNull()
    .defaultNow(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
});

export const devotionsRelations = relations(devotions, ({ many }) => {
  return {
    sourceDocuments: many(sourceDocuments),
  };
});

export const userMessages = pgTable(
  "user_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    aiId: text("ai_id"),
    text: text("text").notNull(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      aiIdIdx: index("ai_id").on(table.aiId),
      textIdx: index("text").on(table.text),
    };
  }
);

export const userMessagesRelations = relations(
  userMessages,
  ({ one, many }) => {
    return {
      chat: one(chats, {
        fields: [userMessages.chatId],
        references: [chats.id],
      }),
      user: one(users, {
        fields: [userMessages.userId],
        references: [users.id],
      }),
      aiResponses: many(aiResponses),
    };
  }
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    sessionToken: text("session_token").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expires: timestamp("expires", { precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
      sessionTokenKey: uniqueIndex("session_token_key").on(table.sessionToken),
    };
  }
);

export const sessionRelations = relations(sessions, ({ one }) => {
  return {
    user: one(users, {
      fields: [sessions.userId],
      references: [users.id],
    }),
  };
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      providerProviderAccountIdKey: uniqueIndex(
        "provider_provider_account_id_key"
      ).on(table.provider, table.providerAccountId),
    };
  }
);

export const accountsRelations = relations(accounts, ({ one }) => {
  return {
    user: one(users, {
      fields: [accounts.userId],
      references: [users.id],
    }),
  };
});

export const indexOperations = pgTable(
  "index_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    type: indexOperationType("type").notNull(),
    status: indexOperationStatus("status").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => {
    return {
      typeIdx: index("index_operation_type").on(table.type),
      statusIdx: index("index_operation_status").on(table.status),
    };
  }
);

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    name: text("name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      nameIdx: index("chat_name").on(table.name),
    };
  }
);

export const chatsRelations = relations(chats, ({ one, many }) => {
  return {
    user: one(users, {
      fields: [chats.userId],
      references: [users.id],
    }),
    userMessages: many(userMessages),
    aiResponses: many(aiResponses),
  };
});

export const aiResponsesToSourceDocuments = pgTable(
  "ai_responses_to_source_documents",
  {
    aiResponseId: uuid("ai_response_id")
      .notNull()
      .references(() => aiResponses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => sourceDocuments.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => {
    return {
      aiResponseSourceDocumentKey: uniqueIndex(
        "ai_response_source_document_key"
      ).on(table.aiResponseId, table.sourceDocumentId),
    };
  }
);

export const devotionsToSourceDocuments = pgTable(
  "devotions_to_source_documents",
  {
    devotionId: uuid("devotion_id")
      .notNull()
      .references(() => devotions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sourceDocumentId: uuid("source_document_id")
      .notNull()
      .references(() => sourceDocuments.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => {
    return {
      devotionSourceDocumentKey: uniqueIndex("devotion_source_document_key").on(
        table.devotionId,
        table.sourceDocumentId
      ),
    };
  }
);

export const usersToRoles = pgTable(
  "users_to_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      userRoleKey: uniqueIndex("user_role_key").on(table.userId, table.roleId),
    };
  }
);
