import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  json,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const aiResponses = pgTable("ai_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  aiId: text("ai_id"),
  text: text("text"),
  failed: boolean("failed").notNull().default(false),
  regenerated: boolean("regenerated").notNull().default(false),
  userMessageId: uuid("user_message_id")
    .notNull()
    .references(() => userMessages.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: uuid("user_id")
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
  };
});

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    name: text("name").notNull(),
    permissions: jsonb("permissions").notNull().default([]).$type<string[]>(),
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
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    name: text("name"),
    email: text("email").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    image: text("image"),
  },
  (table) => {
    return {
      emailKey: uniqueIndex("users_email_key").on(table.email),
      stripeCustomerIdIdx: index("users_stripe_customer_id").on(
        table.stripeCustomerId
      ),
    };
  }
);

export const usersRelations = relations(users, ({ many }) => {
  return {
    roles: many(roles),
    userQueryCounts: many(userQueryCounts),
  };
});

export const userQueryCounts = pgTable(
  "user_query_counts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    date: date("date", { mode: "date" }).notNull().defaultNow(),
    count: integer("count").notNull().default(0),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      dateIdx: index("user_query_counts_date").on(table.date),
      userIdIdx: index("user_query_counts_user_id").on(table.userId),
    };
  }
);

export const userQueryCountsRelations = relations(
  userQueryCounts,
  ({ one }) => {
    return {
      user: one(users, {
        fields: [userQueryCounts.userId],
        references: [users.id],
      }),
    };
  }
);

export const devotions = pgTable(
  "devotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    date: date("date", { mode: "date" }).notNull().defaultNow(),
    bibleReading: text("bible_reading").notNull(),
    summary: text("summary").notNull(),
    reflection: text("reflection"),
    prayer: text("prayer"),
    failed: boolean("failed").notNull().default(false),
  },
  (table) => {
    return {
      dateIdx: index("devotions_date").on(table.date),
    };
  }
);

export const devotionsRelations = relations(devotions, ({ many }) => {
  return {
    images: many(devotionImages),
    reactions: many(devotionReactions),
  };
});

export const devotionReactions = pgTable(
  "devotion_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    devotionId: uuid("devotion_id")
      .notNull()
      .references(() => devotions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    reaction: text("reaction", { enum: ["LIKE", "DISLIKE"] }).notNull(),
  },
  (table) => {
    return {
      devotionIdIdx: index("devotion_reactions_devotion_id").on(
        table.devotionId
      ),
    };
  }
);

export const devotionReactionsRelations = relations(
  devotionReactions,
  ({ one }) => {
    return {
      devotion: one(devotions, {
        fields: [devotionReactions.devotionId],
        references: [devotions.id],
      }),
      user: one(users, {
        fields: [devotionReactions.userId],
        references: [users.id],
      }),
    };
  }
);

export const devotionImages = pgTable(
  "devotion_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    devotionId: uuid("devotion_id")
      .notNull()
      .references(() => devotions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    url: text("url").notNull(),
    caption: text("caption"),
    prompt: text("prompt"),
    negativePrompt: text("negative_prompt"),
  },
  (table) => {
    return {
      devotionIdIdx: index("devotion_images_devotion_id").on(table.devotionId),
    };
  }
);

export const devotionImagesRelations = relations(devotionImages, ({ one }) => {
  return {
    devotion: one(devotions, {
      fields: [devotionImages.devotionId],
      references: [devotions.id],
    }),
  };
});

export const userMessages = pgTable(
  "user_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    aiId: text("ai_id"),
    text: text("text").notNull(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
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

export const indexOperations = pgTable(
  "index_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    type: text("type", {
      enum: ["WEBSITE", "FILE", "WEBPAGE"],
    }).notNull(),
    status: text("status", {
      enum: ["FAILED", "SUCCEEDED", "RUNNING", "COMPLETED"],
    }).notNull(),
    metadata: json("metadata").default({}).notNull(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    name: text("name").notNull(),
    userId: uuid("user_id")
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
    sourceDocumentId: uuid("source_document_id").notNull(),
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
    sourceDocumentId: uuid("source_document_id").notNull(),
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
