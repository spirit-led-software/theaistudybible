import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { Context } from '../index';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
  deleteUserMessage?: Maybe<UserMessage>;
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


export type MutationDeleteUserMessageArgs = {
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
  aiResponses?: Maybe<Array<AiResponse>>;
  chats?: Maybe<Array<Chat>>;
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  generatedImages?: Maybe<Array<UserGeneratedImage>>;
  hasCustomImage: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  image?: Maybe<Scalars['String']['output']>;
  messages?: Maybe<Array<UserMessage>>;
  name?: Maybe<Scalars['String']['output']>;
  password?: Maybe<UserPassword>;
  roles?: Maybe<Array<Role>>;
  stripeCustomerId?: Maybe<Scalars['String']['output']>;
  translation: Translation;
  updatedAt: Scalars['Date']['output'];
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
  url: Scalars['String']['output'];
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<RefType extends Record<string, unknown>> = ResolversObject<{
  BaseModel: ( AiResponse ) | ( AiResponseReaction ) | ( Chat ) | ( DataSource ) | ( Devotion ) | ( DevotionImage ) | ( DevotionReaction ) | ( IndexOperation ) | ( Role ) | ( User ) | ( UserGeneratedImage ) | ( UserMessage ) | ( UserPassword );
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AiResponse: ResolverTypeWrapper<AiResponse>;
  AiResponseReaction: ResolverTypeWrapper<AiResponseReaction>;
  AiResponseReactionType: AiResponseReactionType;
  BaseModel: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['BaseModel']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Chat: ResolverTypeWrapper<Chat>;
  ChatMessage: ResolverTypeWrapper<ChatMessage>;
  ChatMessageRole: ChatMessageRole;
  ColumnPlaceholder: ColumnPlaceholder;
  ColumnValue: ColumnValue;
  CreateAiResponseReactionInput: CreateAiResponseReactionInput;
  CreateChatInput: CreateChatInput;
  CreateDataSourceInput: CreateDataSourceInput;
  CreateDevotionReactionInput: CreateDevotionReactionInput;
  CreateRoleInput: CreateRoleInput;
  CreateUserInput: CreateUserInput;
  DataSource: ResolverTypeWrapper<DataSource>;
  DataSourceType: DataSourceType;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Devotion: ResolverTypeWrapper<Devotion>;
  DevotionImage: ResolverTypeWrapper<DevotionImage>;
  DevotionReaction: ResolverTypeWrapper<DevotionReaction>;
  DevotionReactionCount: ResolverTypeWrapper<DevotionReactionCount>;
  DevotionReactionType: DevotionReactionType;
  DistanceMetric: DistanceMetric;
  FilterInput: FilterInput;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  IndexOperation: ResolverTypeWrapper<IndexOperation>;
  IndexOperationStatus: IndexOperationStatus;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Metadata: ResolverTypeWrapper<Scalars['Metadata']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Role: ResolverTypeWrapper<Role>;
  SortInput: SortInput;
  SortOrder: SortOrder;
  SourceDocument: ResolverTypeWrapper<SourceDocument>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SyncSchedule: SyncSchedule;
  Translation: Translation;
  UpdateAiResponseReactionInput: UpdateAiResponseReactionInput;
  UpdateChatInput: UpdateChatInput;
  UpdateDataSourceInput: UpdateDataSourceInput;
  UpdateDevotionImage: UpdateDevotionImage;
  UpdateDevotionInput: UpdateDevotionInput;
  UpdateDevotionReactionInput: UpdateDevotionReactionInput;
  UpdateIndexOperationInput: UpdateIndexOperationInput;
  UpdateRoleInput: UpdateRoleInput;
  UpdateUserInput: UpdateUserInput;
  User: ResolverTypeWrapper<User>;
  UserGeneratedImage: ResolverTypeWrapper<UserGeneratedImage>;
  UserMessage: ResolverTypeWrapper<UserMessage>;
  UserPassword: ResolverTypeWrapper<UserPassword>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AiResponse: AiResponse;
  AiResponseReaction: AiResponseReaction;
  BaseModel: ResolversInterfaceTypes<ResolversParentTypes>['BaseModel'];
  Boolean: Scalars['Boolean']['output'];
  Chat: Chat;
  ChatMessage: ChatMessage;
  ColumnPlaceholder: ColumnPlaceholder;
  ColumnValue: ColumnValue;
  CreateAiResponseReactionInput: CreateAiResponseReactionInput;
  CreateChatInput: CreateChatInput;
  CreateDataSourceInput: CreateDataSourceInput;
  CreateDevotionReactionInput: CreateDevotionReactionInput;
  CreateRoleInput: CreateRoleInput;
  CreateUserInput: CreateUserInput;
  DataSource: DataSource;
  Date: Scalars['Date']['output'];
  Devotion: Devotion;
  DevotionImage: DevotionImage;
  DevotionReaction: DevotionReaction;
  DevotionReactionCount: DevotionReactionCount;
  FilterInput: FilterInput;
  Float: Scalars['Float']['output'];
  IndexOperation: IndexOperation;
  Int: Scalars['Int']['output'];
  Metadata: Scalars['Metadata']['output'];
  Mutation: {};
  Query: {};
  Role: Role;
  SortInput: SortInput;
  SourceDocument: SourceDocument;
  String: Scalars['String']['output'];
  UpdateAiResponseReactionInput: UpdateAiResponseReactionInput;
  UpdateChatInput: UpdateChatInput;
  UpdateDataSourceInput: UpdateDataSourceInput;
  UpdateDevotionImage: UpdateDevotionImage;
  UpdateDevotionInput: UpdateDevotionInput;
  UpdateDevotionReactionInput: UpdateDevotionReactionInput;
  UpdateIndexOperationInput: UpdateIndexOperationInput;
  UpdateRoleInput: UpdateRoleInput;
  UpdateUserInput: UpdateUserInput;
  User: User;
  UserGeneratedImage: UserGeneratedImage;
  UserMessage: UserMessage;
  UserPassword: UserPassword;
}>;

export type AiResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AiResponse'] = ResolversParentTypes['AiResponse']> = ResolversObject<{
  aiId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  chat?: Resolver<Maybe<ResolversTypes['Chat']>, ParentType, ContextType>;
  chatId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  regenerated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  searchQueries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  sourceDocuments?: Resolver<Maybe<Array<ResolversTypes['SourceDocument']>>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userMessage?: Resolver<Maybe<ResolversTypes['UserMessage']>, ParentType, ContextType>;
  userMessageId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AiResponseReactionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AiResponseReaction'] = ResolversParentTypes['AiResponseReaction']> = ResolversObject<{
  aiResponse?: Resolver<Maybe<ResolversTypes['AiResponse']>, ParentType, ContextType>;
  aiResponseId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reaction?: Resolver<ResolversTypes['AiResponseReactionType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BaseModelResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BaseModel'] = ResolversParentTypes['BaseModel']> = ResolversObject<{
  __resolveType: TypeResolveFn<'AiResponse' | 'AiResponseReaction' | 'Chat' | 'DataSource' | 'Devotion' | 'DevotionImage' | 'DevotionReaction' | 'IndexOperation' | 'Role' | 'User' | 'UserGeneratedImage' | 'UserMessage' | 'UserPassword', ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
}>;

export type ChatResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Chat'] = ResolversParentTypes['Chat']> = ResolversObject<{
  aiResponses?: Resolver<Maybe<Array<ResolversTypes['AiResponse']>>, ParentType, ContextType, Partial<ChatAiResponsesArgs>>;
  chatMessages?: Resolver<Maybe<Array<ResolversTypes['ChatMessage']>>, ParentType, ContextType, Partial<ChatChatMessagesArgs>>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  customName?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userMessages?: Resolver<Maybe<Array<ResolversTypes['UserMessage']>>, ParentType, ContextType, Partial<ChatUserMessagesArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChatMessageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ChatMessage'] = ResolversParentTypes['ChatMessage']> = ResolversObject<{
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['ChatMessageRole'], ParentType, ContextType>;
  searchQueries?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  uuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DataSourceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DataSource'] = ResolversParentTypes['DataSource']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  indexOperations?: Resolver<Maybe<Array<ResolversTypes['IndexOperation']>>, ParentType, ContextType, Partial<DataSourceIndexOperationsArgs>>;
  lastAutomaticSync?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastManualSync?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<ResolversTypes['Metadata'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  numberOfDocuments?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  syncSchedule?: Resolver<ResolversTypes['SyncSchedule'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['DataSourceType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type DevotionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Devotion'] = ResolversParentTypes['Devotion']> = ResolversObject<{
  bibleReading?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  diveDeeperQueries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  images?: Resolver<Maybe<Array<ResolversTypes['DevotionImage']>>, ParentType, ContextType>;
  prayer?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reactions?: Resolver<Maybe<Array<ResolversTypes['DevotionReaction']>>, ParentType, ContextType, Partial<DevotionReactionsArgs>>;
  reflection?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourceDocuments?: Resolver<Maybe<Array<ResolversTypes['SourceDocument']>>, ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  topic?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DevotionImageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DevotionImage'] = ResolversParentTypes['DevotionImage']> = ResolversObject<{
  caption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  devotion?: Resolver<Maybe<ResolversTypes['Devotion']>, ParentType, ContextType>;
  devotionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  negativePrompt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  prompt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DevotionReactionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DevotionReaction'] = ResolversParentTypes['DevotionReaction']> = ResolversObject<{
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  devotion?: Resolver<Maybe<ResolversTypes['Devotion']>, ParentType, ContextType>;
  devotionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reaction?: Resolver<ResolversTypes['DevotionReactionType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DevotionReactionCountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DevotionReactionCount'] = ResolversParentTypes['DevotionReactionCount']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['DevotionReactionType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type IndexOperationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['IndexOperation'] = ResolversParentTypes['IndexOperation']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  dataSource?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType>;
  dataSourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  errorMessages?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metadata?: Resolver<ResolversTypes['Metadata'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['IndexOperationStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface MetadataScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Metadata'], any> {
  name: 'Metadata';
}

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createAiResponseReaction?: Resolver<Maybe<ResolversTypes['AiResponseReaction']>, ParentType, ContextType, RequireFields<MutationCreateAiResponseReactionArgs, 'input'>>;
  createChat?: Resolver<Maybe<ResolversTypes['Chat']>, ParentType, ContextType, RequireFields<MutationCreateChatArgs, 'input'>>;
  createDataSource?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType, RequireFields<MutationCreateDataSourceArgs, 'input'>>;
  createDevotionReaction?: Resolver<Maybe<ResolversTypes['DevotionReaction']>, ParentType, ContextType, RequireFields<MutationCreateDevotionReactionArgs, 'input'>>;
  createRole?: Resolver<Maybe<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<MutationCreateRoleArgs, 'input'>>;
  createUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteAiResponse?: Resolver<Maybe<ResolversTypes['AiResponse']>, ParentType, ContextType, RequireFields<MutationDeleteAiResponseArgs, 'id'>>;
  deleteAiResponseReaction?: Resolver<Maybe<ResolversTypes['AiResponseReaction']>, ParentType, ContextType, RequireFields<MutationDeleteAiResponseReactionArgs, 'id'>>;
  deleteChat?: Resolver<Maybe<ResolversTypes['Chat']>, ParentType, ContextType, RequireFields<MutationDeleteChatArgs, 'id'>>;
  deleteDataSource?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType, RequireFields<MutationDeleteDataSourceArgs, 'id'>>;
  deleteDevotion?: Resolver<Maybe<ResolversTypes['Devotion']>, ParentType, ContextType, RequireFields<MutationDeleteDevotionArgs, 'id'>>;
  deleteDevotionImage?: Resolver<Maybe<ResolversTypes['DevotionImage']>, ParentType, ContextType, RequireFields<MutationDeleteDevotionImageArgs, 'id'>>;
  deleteDevotionReaction?: Resolver<Maybe<ResolversTypes['DevotionReaction']>, ParentType, ContextType, RequireFields<MutationDeleteDevotionReactionArgs, 'id'>>;
  deleteIndexOperation?: Resolver<Maybe<ResolversTypes['IndexOperation']>, ParentType, ContextType, RequireFields<MutationDeleteIndexOperationArgs, 'id'>>;
  deleteRole?: Resolver<Maybe<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<MutationDeleteRoleArgs, 'id'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  deleteUserMessage?: Resolver<Maybe<ResolversTypes['UserMessage']>, ParentType, ContextType, RequireFields<MutationDeleteUserMessageArgs, 'id'>>;
  updateAiResponseReaction?: Resolver<Maybe<ResolversTypes['AiResponseReaction']>, ParentType, ContextType, RequireFields<MutationUpdateAiResponseReactionArgs, 'id' | 'input'>>;
  updateChat?: Resolver<Maybe<ResolversTypes['Chat']>, ParentType, ContextType, RequireFields<MutationUpdateChatArgs, 'id' | 'input'>>;
  updateDataSource?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType, RequireFields<MutationUpdateDataSourceArgs, 'id' | 'input'>>;
  updateDevotion?: Resolver<Maybe<ResolversTypes['Devotion']>, ParentType, ContextType, RequireFields<MutationUpdateDevotionArgs, 'id' | 'input'>>;
  updateDevotionImage?: Resolver<Maybe<ResolversTypes['DevotionImage']>, ParentType, ContextType, RequireFields<MutationUpdateDevotionImageArgs, 'id' | 'input'>>;
  updateDevotionReaction?: Resolver<Maybe<ResolversTypes['DevotionReaction']>, ParentType, ContextType, RequireFields<MutationUpdateDevotionReactionArgs, 'id' | 'input'>>;
  updateIndexOperation?: Resolver<Maybe<ResolversTypes['IndexOperation']>, ParentType, ContextType, RequireFields<MutationUpdateIndexOperationArgs, 'id' | 'input'>>;
  updateRole?: Resolver<Maybe<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<MutationUpdateRoleArgs, 'id' | 'input'>>;
  updateUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  aiResponse?: Resolver<Maybe<ResolversTypes['AiResponse']>, ParentType, ContextType, RequireFields<QueryAiResponseArgs, 'id'>>;
  aiResponseReaction?: Resolver<Maybe<ResolversTypes['AiResponseReaction']>, ParentType, ContextType, RequireFields<QueryAiResponseReactionArgs, 'id'>>;
  aiResponseReactions?: Resolver<Array<ResolversTypes['AiResponseReaction']>, ParentType, ContextType, Partial<QueryAiResponseReactionsArgs>>;
  aiResponses?: Resolver<Array<ResolversTypes['AiResponse']>, ParentType, ContextType, Partial<QueryAiResponsesArgs>>;
  chat?: Resolver<Maybe<ResolversTypes['Chat']>, ParentType, ContextType, RequireFields<QueryChatArgs, 'id'>>;
  chatMessages?: Resolver<Array<ResolversTypes['ChatMessage']>, ParentType, ContextType, RequireFields<QueryChatMessagesArgs, 'chatId'>>;
  chats?: Resolver<Array<ResolversTypes['Chat']>, ParentType, ContextType, Partial<QueryChatsArgs>>;
  currentUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  dataSource?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType, RequireFields<QueryDataSourceArgs, 'id'>>;
  dataSources?: Resolver<Array<ResolversTypes['DataSource']>, ParentType, ContextType, Partial<QueryDataSourcesArgs>>;
  devotion?: Resolver<Maybe<ResolversTypes['Devotion']>, ParentType, ContextType, RequireFields<QueryDevotionArgs, 'id'>>;
  devotionImage?: Resolver<Maybe<ResolversTypes['DevotionImage']>, ParentType, ContextType, RequireFields<QueryDevotionImageArgs, 'id'>>;
  devotionImages?: Resolver<Array<ResolversTypes['DevotionImage']>, ParentType, ContextType, Partial<QueryDevotionImagesArgs>>;
  devotionReaction?: Resolver<Maybe<ResolversTypes['DevotionReaction']>, ParentType, ContextType, RequireFields<QueryDevotionReactionArgs, 'id'>>;
  devotionReactionCount?: Resolver<Array<ResolversTypes['DevotionReactionCount']>, ParentType, ContextType, RequireFields<QueryDevotionReactionCountArgs, 'devotionId'>>;
  devotionReactions?: Resolver<Array<ResolversTypes['DevotionReaction']>, ParentType, ContextType, Partial<QueryDevotionReactionsArgs>>;
  devotions?: Resolver<Array<ResolversTypes['Devotion']>, ParentType, ContextType, Partial<QueryDevotionsArgs>>;
  indexOperation?: Resolver<Maybe<ResolversTypes['IndexOperation']>, ParentType, ContextType, RequireFields<QueryIndexOperationArgs, 'id'>>;
  indexOperations?: Resolver<Array<ResolversTypes['IndexOperation']>, ParentType, ContextType, Partial<QueryIndexOperationsArgs>>;
  role?: Resolver<Maybe<ResolversTypes['Role']>, ParentType, ContextType, RequireFields<QueryRoleArgs, 'id'>>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType, Partial<QueryRolesArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  userGeneratedImage?: Resolver<Maybe<ResolversTypes['UserGeneratedImage']>, ParentType, ContextType, RequireFields<QueryUserGeneratedImageArgs, 'id'>>;
  userGeneratedImages?: Resolver<Array<ResolversTypes['UserGeneratedImage']>, ParentType, ContextType, Partial<QueryUserGeneratedImagesArgs>>;
  userMessage?: Resolver<Maybe<ResolversTypes['UserMessage']>, ParentType, ContextType, RequireFields<QueryUserMessageArgs, 'id'>>;
  userMessages?: Resolver<Array<ResolversTypes['UserMessage']>, ParentType, ContextType, Partial<QueryUserMessagesArgs>>;
  userPassword?: Resolver<Maybe<ResolversTypes['UserPassword']>, ParentType, ContextType, RequireFields<QueryUserPasswordArgs, 'id'>>;
  userPasswords?: Resolver<Array<ResolversTypes['UserPassword']>, ParentType, ContextType, Partial<QueryUserPasswordsArgs>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
}>;

export type RoleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  users?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType, Partial<RoleUsersArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SourceDocumentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SourceDocument'] = ResolversParentTypes['SourceDocument']> = ResolversObject<{
  distance?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  distanceMetric?: Resolver<Maybe<ResolversTypes['DistanceMetric']>, ParentType, ContextType>;
  embedding?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metadata?: Resolver<ResolversTypes['Metadata'], ParentType, ContextType>;
  pageContent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  aiResponses?: Resolver<Maybe<Array<ResolversTypes['AiResponse']>>, ParentType, ContextType, Partial<UserAiResponsesArgs>>;
  chats?: Resolver<Maybe<Array<ResolversTypes['Chat']>>, ParentType, ContextType, Partial<UserChatsArgs>>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generatedImages?: Resolver<Maybe<Array<ResolversTypes['UserGeneratedImage']>>, ParentType, ContextType, Partial<UserGeneratedImagesArgs>>;
  hasCustomImage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  messages?: Resolver<Maybe<Array<ResolversTypes['UserMessage']>>, ParentType, ContextType, Partial<UserMessagesArgs>>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  password?: Resolver<Maybe<ResolversTypes['UserPassword']>, ParentType, ContextType>;
  roles?: Resolver<Maybe<Array<ResolversTypes['Role']>>, ParentType, ContextType>;
  stripeCustomerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  translation?: Resolver<ResolversTypes['Translation'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserGeneratedImageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserGeneratedImage'] = ResolversParentTypes['UserGeneratedImage']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  negativePrompt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  prompt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  searchQueries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  sourceDocuments?: Resolver<Maybe<Array<ResolversTypes['SourceDocument']>>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userPrompt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserMessageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserMessage'] = ResolversParentTypes['UserMessage']> = ResolversObject<{
  aiId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  chat?: Resolver<Maybe<ResolversTypes['Chat']>, ParentType, ContextType>;
  chatId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserPasswordResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserPassword'] = ResolversParentTypes['UserPassword']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  passwordHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  salt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  AiResponse?: AiResponseResolvers<ContextType>;
  AiResponseReaction?: AiResponseReactionResolvers<ContextType>;
  BaseModel?: BaseModelResolvers<ContextType>;
  Chat?: ChatResolvers<ContextType>;
  ChatMessage?: ChatMessageResolvers<ContextType>;
  DataSource?: DataSourceResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Devotion?: DevotionResolvers<ContextType>;
  DevotionImage?: DevotionImageResolvers<ContextType>;
  DevotionReaction?: DevotionReactionResolvers<ContextType>;
  DevotionReactionCount?: DevotionReactionCountResolvers<ContextType>;
  IndexOperation?: IndexOperationResolvers<ContextType>;
  Metadata?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  SourceDocument?: SourceDocumentResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserGeneratedImage?: UserGeneratedImageResolvers<ContextType>;
  UserMessage?: UserMessageResolvers<ContextType>;
  UserPassword?: UserPasswordResolvers<ContextType>;
}>;

