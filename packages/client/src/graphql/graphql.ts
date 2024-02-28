/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  Metadata: { input: any; output: any; }
};

export type AiResponse = BaseModel & {
  __typename?: 'AiResponse';
  aiId?: Maybe<Scalars['String']['output']>;
  chat?: Maybe<Chat>;
  chatId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  failed: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  modelId: Scalars['String']['output'];
  regenerated: Scalars['Boolean']['output'];
  searchQueries: Array<Scalars['String']['output']>;
  sourceDocuments?: Maybe<Array<SourceDocument>>;
  text?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  userMessage?: Maybe<UserMessage>;
  userMessageId: Scalars['String']['output'];
};

export type AiResponseReaction = BaseModel & {
  __typename?: 'AiResponseReaction';
  aiResponse?: Maybe<AiResponse>;
  aiResponseId: Scalars['String']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  reaction: AiResponseReactionType;
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type AiResponseReactionType =
  | 'DISLIKE'
  | 'LIKE';

export type BaseModel = {
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type Chat = BaseModel & {
  __typename?: 'Chat';
  aiResponses?: Maybe<Array<AiResponse>>;
  chatMessages?: Maybe<Array<ChatMessage>>;
  createdAt: Scalars['Date']['output'];
  customName: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  userMessages?: Maybe<Array<UserMessage>>;
};


export type ChatAiResponsesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type ChatChatMessagesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type ChatUserMessagesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type ChatMessage = {
  __typename?: 'ChatMessage';
  content: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  id: Scalars['String']['output'];
  modelId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  role: ChatMessageRole;
  searchQueries?: Maybe<Array<Scalars['String']['output']>>;
  uuid?: Maybe<Scalars['String']['output']>;
};

export type ChatMessageRole =
  | 'assistant'
  | 'data'
  | 'function'
  | 'system'
  | 'tool'
  | 'user';

export type ColumnPlaceholder = {
  column: Scalars['String']['input'];
  placeholder: Scalars['String']['input'];
};

export type ColumnValue = {
  column: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CreateAiResponseReactionInput = {
  aiResponseId: Scalars['String']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  reaction: AiResponseReactionType;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateChatInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDataSourceInput = {
  metadata?: InputMaybe<Scalars['Metadata']['input']>;
  name: Scalars['String']['input'];
  syncSchedule?: InputMaybe<SyncSchedule>;
  type: DataSourceType;
  url: Scalars['String']['input'];
};

export type CreateDevotionReactionInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  devotionId: Scalars['String']['input'];
  reaction: DevotionReactionType;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRoleInput = {
  name: Scalars['String']['input'];
  permissions: Array<Scalars['String']['input']>;
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  translation?: InputMaybe<Translation>;
};

export type DataSource = BaseModel & {
  __typename?: 'DataSource';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  indexOperations?: Maybe<Array<IndexOperation>>;
  lastAutomaticSync?: Maybe<Scalars['String']['output']>;
  lastManualSync?: Maybe<Scalars['String']['output']>;
  metadata: Scalars['Metadata']['output'];
  name: Scalars['String']['output'];
  numberOfDocuments: Scalars['Int']['output'];
  syncSchedule: SyncSchedule;
  type: DataSourceType;
  updatedAt: Scalars['Date']['output'];
  url: Scalars['String']['output'];
};


export type DataSourceIndexOperationsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type DataSourceType =
  | 'FILE'
  | 'REMOTE_FILE'
  | 'WEBPAGE'
  | 'WEB_CRAWL'
  | 'YOUTUBE';

export type Devotion = BaseModel & {
  __typename?: 'Devotion';
  bibleReading: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  diveDeeperQueries: Array<Scalars['String']['output']>;
  failed: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  images?: Maybe<Array<DevotionImage>>;
  prayer?: Maybe<Scalars['String']['output']>;
  reactions?: Maybe<Array<DevotionReaction>>;
  reflection?: Maybe<Scalars['String']['output']>;
  sourceDocuments?: Maybe<Array<SourceDocument>>;
  summary: Scalars['String']['output'];
  topic: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};


export type DevotionReactionsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type DevotionImage = BaseModel & {
  __typename?: 'DevotionImage';
  caption?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  devotion?: Maybe<Devotion>;
  devotionId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  negativePrompt?: Maybe<Scalars['String']['output']>;
  prompt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
  url: Scalars['String']['output'];
};

export type DevotionReaction = BaseModel & {
  __typename?: 'DevotionReaction';
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  devotion?: Maybe<Devotion>;
  devotionId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  reaction: DevotionReactionType;
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type DevotionReactionCount = {
  __typename?: 'DevotionReactionCount';
  count: Scalars['Int']['output'];
  type: DevotionReactionType;
};

export type DevotionReactionType =
  | 'DISLIKE'
  | 'LIKE';

export type DistanceMetric =
  | 'cosine'
  | 'innerProduct'
  | 'l2';

export type FilterInput = {
  AND?: InputMaybe<Array<FilterInput>>;
  NOT?: InputMaybe<FilterInput>;
  OR?: InputMaybe<Array<FilterInput>>;
  eq?: InputMaybe<ColumnValue>;
  gt?: InputMaybe<ColumnValue>;
  gte?: InputMaybe<ColumnValue>;
  iLike?: InputMaybe<ColumnPlaceholder>;
  like?: InputMaybe<ColumnPlaceholder>;
  lt?: InputMaybe<ColumnValue>;
  lte?: InputMaybe<ColumnValue>;
  neq?: InputMaybe<ColumnValue>;
  notLike?: InputMaybe<ColumnPlaceholder>;
};

export type IndexOperation = BaseModel & {
  __typename?: 'IndexOperation';
  createdAt: Scalars['Date']['output'];
  dataSource?: Maybe<DataSource>;
  dataSourceId: Scalars['String']['output'];
  errorMessages: Array<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  metadata: Scalars['Metadata']['output'];
  status: IndexOperationStatus;
  updatedAt: Scalars['Date']['output'];
};

export type IndexOperationStatus =
  | 'COMPLETED'
  | 'FAILED'
  | 'RUNNING'
  | 'SUCCEEDED';

export type Mutation = {
  __typename?: 'Mutation';
  createAiResponseReaction?: Maybe<AiResponseReaction>;
  createChat?: Maybe<Chat>;
  createDataSource?: Maybe<DataSource>;
  createDevotionReaction?: Maybe<DevotionReaction>;
  createRole?: Maybe<Role>;
  createUser?: Maybe<User>;
  deleteAiResponse?: Maybe<AiResponse>;
  deleteAiResponseReaction?: Maybe<AiResponseReaction>;
  deleteChat?: Maybe<Chat>;
  deleteDataSource?: Maybe<DataSource>;
  deleteDevotion?: Maybe<Devotion>;
  deleteDevotionImage?: Maybe<DevotionImage>;
  deleteDevotionReaction?: Maybe<DevotionReaction>;
  deleteIndexOperation?: Maybe<IndexOperation>;
  deleteRole?: Maybe<Role>;
  deleteUser?: Maybe<User>;
  deleteUserGeneratedImage?: Maybe<UserGeneratedImage>;
  deleteUserMessage?: Maybe<UserMessage>;
  deleteUserPassword?: Maybe<UserPassword>;
  updateAiResponseReaction?: Maybe<AiResponseReaction>;
  updateChat?: Maybe<Chat>;
  updateDataSource?: Maybe<DataSource>;
  updateDevotion?: Maybe<Devotion>;
  updateDevotionImage?: Maybe<DevotionImage>;
  updateDevotionReaction?: Maybe<DevotionReaction>;
  updateIndexOperation?: Maybe<IndexOperation>;
  updateRole?: Maybe<Role>;
  updateUser?: Maybe<User>;
};


export type MutationCreateAiResponseReactionArgs = {
  input: CreateAiResponseReactionInput;
};


export type MutationCreateChatArgs = {
  input: CreateChatInput;
};


export type MutationCreateDataSourceArgs = {
  input: CreateDataSourceInput;
};


export type MutationCreateDevotionReactionArgs = {
  input: CreateDevotionReactionInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteAiResponseArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteAiResponseReactionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteChatArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteDataSourceArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteDevotionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteDevotionImageArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteDevotionReactionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteIndexOperationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRoleArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteUserGeneratedImageArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteUserMessageArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteUserPasswordArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateAiResponseReactionArgs = {
  id: Scalars['String']['input'];
  input: UpdateAiResponseReactionInput;
};


export type MutationUpdateChatArgs = {
  id: Scalars['String']['input'];
  input: UpdateChatInput;
};


export type MutationUpdateDataSourceArgs = {
  id: Scalars['String']['input'];
  input: UpdateDataSourceInput;
};


export type MutationUpdateDevotionArgs = {
  id: Scalars['String']['input'];
  input: UpdateDevotionInput;
};


export type MutationUpdateDevotionImageArgs = {
  id: Scalars['String']['input'];
  input: UpdateDevotionImage;
};


export type MutationUpdateDevotionReactionArgs = {
  id: Scalars['String']['input'];
  input: UpdateDevotionReactionInput;
};


export type MutationUpdateIndexOperationArgs = {
  id: Scalars['String']['input'];
  input: UpdateIndexOperationInput;
};


export type MutationUpdateRoleArgs = {
  id: Scalars['String']['input'];
  input: UpdateRoleInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['String']['input'];
  input: UpdateUserInput;
};

export type Query = {
  __typename?: 'Query';
  aiResponse?: Maybe<AiResponse>;
  aiResponseReaction?: Maybe<AiResponseReaction>;
  aiResponseReactions: Array<AiResponseReaction>;
  aiResponses: Array<AiResponse>;
  chat?: Maybe<Chat>;
  chatMessages: Array<ChatMessage>;
  chats: Array<Chat>;
  currentUser?: Maybe<User>;
  currentUserPassword?: Maybe<UserPassword>;
  dataSource?: Maybe<DataSource>;
  dataSources: Array<DataSource>;
  devotion?: Maybe<Devotion>;
  devotionImage?: Maybe<DevotionImage>;
  devotionImages: Array<DevotionImage>;
  devotionReaction?: Maybe<DevotionReaction>;
  devotionReactionCount: Array<DevotionReactionCount>;
  devotionReactions: Array<DevotionReaction>;
  devotions: Array<Devotion>;
  indexOperation?: Maybe<IndexOperation>;
  indexOperations: Array<IndexOperation>;
  role?: Maybe<Role>;
  roles: Array<Role>;
  user?: Maybe<User>;
  userGeneratedImage?: Maybe<UserGeneratedImage>;
  userGeneratedImages: Array<UserGeneratedImage>;
  userMessage?: Maybe<UserMessage>;
  userMessages: Array<UserMessage>;
  userPassword?: Maybe<UserPassword>;
  userPasswords: Array<UserPassword>;
  users: Array<User>;
};


export type QueryAiResponseArgs = {
  id: Scalars['String']['input'];
};


export type QueryAiResponseReactionArgs = {
  id: Scalars['String']['input'];
};


export type QueryAiResponseReactionsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryAiResponsesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryChatArgs = {
  id: Scalars['String']['input'];
};


export type QueryChatMessagesArgs = {
  chatId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryChatsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryDataSourceArgs = {
  id: Scalars['String']['input'];
};


export type QueryDataSourcesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryDevotionArgs = {
  id: Scalars['String']['input'];
};


export type QueryDevotionImageArgs = {
  id: Scalars['String']['input'];
};


export type QueryDevotionImagesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryDevotionReactionArgs = {
  id: Scalars['String']['input'];
};


export type QueryDevotionReactionCountArgs = {
  devotionId: Scalars['String']['input'];
};


export type QueryDevotionReactionsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryDevotionsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryIndexOperationArgs = {
  id: Scalars['String']['input'];
};


export type QueryIndexOperationsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryRoleArgs = {
  id: Scalars['String']['input'];
};


export type QueryRolesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserGeneratedImageArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserGeneratedImagesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryUserMessageArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserMessagesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryUserPasswordArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserPasswordsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type QueryUsersArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type Role = BaseModel & {
  __typename?: 'Role';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
  users?: Maybe<Array<User>>;
};


export type RoleUsersArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type SortInput = {
  field: Scalars['String']['input'];
  order: SortOrder;
};

export type SortOrder =
  | 'asc'
  | 'desc';

export type SourceDocument = {
  __typename?: 'SourceDocument';
  distance?: Maybe<Scalars['Float']['output']>;
  distanceMetric?: Maybe<DistanceMetric>;
  embedding: Scalars['String']['output'];
  id: Scalars['String']['output'];
  metadata: Scalars['Metadata']['output'];
  pageContent: Scalars['String']['output'];
};

export type SyncSchedule =
  | 'DAILY'
  | 'MONTHLY'
  | 'NEVER'
  | 'WEEKLY';

export type Translation =
  | 'ESV'
  | 'NIV'
  | 'NKJV'
  | 'NLT';

export type UpdateAiResponseReactionInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  reaction?: InputMaybe<AiResponseReactionType>;
};

export type UpdateChatInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDataSourceInput = {
  metadata?: InputMaybe<Scalars['Metadata']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  syncSchedule?: InputMaybe<SyncSchedule>;
  type?: InputMaybe<DataSourceType>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDevotionImage = {
  caption?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDevotionInput = {
  bibleReading?: InputMaybe<Scalars['String']['input']>;
  diveDeeperQueries?: InputMaybe<Array<Scalars['String']['input']>>;
  prayer?: InputMaybe<Scalars['String']['input']>;
  reflection?: InputMaybe<Scalars['String']['input']>;
  summary?: InputMaybe<Scalars['String']['input']>;
  topic?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDevotionReactionInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  reaction?: InputMaybe<DevotionReactionType>;
};

export type UpdateIndexOperationInput = {
  metadata?: InputMaybe<Scalars['Metadata']['input']>;
  status?: InputMaybe<IndexOperationStatus>;
};

export type UpdateRoleInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  translation?: InputMaybe<Translation>;
};

export type User = BaseModel & {
  __typename?: 'User';
  aiResponseReactions?: Maybe<Array<AiResponseReaction>>;
  aiResponses?: Maybe<Array<AiResponse>>;
  chats?: Maybe<Array<Chat>>;
  createdAt: Scalars['Date']['output'];
  devotionReactions?: Maybe<Array<DevotionReaction>>;
  email: Scalars['String']['output'];
  generatedImages?: Maybe<Array<UserGeneratedImage>>;
  hasCustomImage: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  image?: Maybe<Scalars['String']['output']>;
  lastSeenAt?: Maybe<Scalars['Date']['output']>;
  messages?: Maybe<Array<UserMessage>>;
  name?: Maybe<Scalars['String']['output']>;
  password?: Maybe<UserPassword>;
  roles?: Maybe<Array<Role>>;
  stripeCustomerId?: Maybe<Scalars['String']['output']>;
  translation: Translation;
  updatedAt: Scalars['Date']['output'];
};


export type UserAiResponseReactionsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type UserAiResponsesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type UserChatsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type UserDevotionReactionsArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type UserGeneratedImagesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};


export type UserMessagesArgs = {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type UserGeneratedImage = BaseModel & {
  __typename?: 'UserGeneratedImage';
  createdAt: Scalars['Date']['output'];
  failed: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  negativePrompt?: Maybe<Scalars['String']['output']>;
  prompt?: Maybe<Scalars['String']['output']>;
  searchQueries: Array<Scalars['String']['output']>;
  sourceDocuments?: Maybe<Array<SourceDocument>>;
  updatedAt: Scalars['Date']['output'];
  url?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  userPrompt: Scalars['String']['output'];
};

export type UserMessage = BaseModel & {
  __typename?: 'UserMessage';
  aiId?: Maybe<Scalars['String']['output']>;
  chat?: Maybe<Chat>;
  chatId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  text: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type UserPassword = BaseModel & {
  __typename?: 'UserPassword';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  passwordHash: Scalars['String']['output'];
  salt: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type UserChatsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
}>;


export type UserChatsQuery = { __typename?: 'Query', user?: { __typename?: 'User', chats?: Array<{ __typename?: 'Chat', id: string, createdAt: any, updatedAt: any, name: string }> | null } | null };

export type UserDevotionReactionsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
}>;


export type UserDevotionReactionsQuery = { __typename?: 'Query', user?: { __typename?: 'User', devotionReactions?: Array<{ __typename?: 'DevotionReaction', id: string, createdAt: any, updatedAt: any, reaction: DevotionReactionType }> | null } | null };


export const UserChatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserChats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UserChatsQuery, UserChatsQueryVariables>;
export const UserDevotionReactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserDevotionReactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devotionReactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reaction"}}]}}]}}]}}]} as unknown as DocumentNode<UserDevotionReactionsQuery, UserDevotionReactionsQueryVariables>;