import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from "aws-lambda";

export const handler: CdkCustomResourceHandler = async (event) => {
  console.log("Received event from custom resource:", JSON.stringify(event));

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  };
  try {
    const email = event.ResourceProperties.email as string;
    const apiKey = event.ResourceProperties.apiKey as string;
    const name = event.ResourceProperties.name as string;
    const region = event.ResourceProperties.region as
      | "eu-west-1"
      | "us-east-1"
      | "us-west-1"
      | "ap-northeast-1"
      | "us-central-1";
    const tls = event.ResourceProperties.tls === "true";
    const eviction = event.ResourceProperties.eviction === "true";
    const autoUpgrade = event.ResourceProperties.autoUpgrade === "true";
    const retainOnDelete = event.ResourceProperties.retainOnDelete === "true";

    console.log(
      `Upstash Redis inputs: apiKey: ${apiKey}, name: ${name}, tls: ${tls}, retainOnDelete: ${retainOnDelete}`
    );

    switch (event.RequestType) {
      case "Delete": {
        if (!retainOnDelete) {
          const databases = await getDatabases({ email, apiKey });
          const database = databases.find((db) => db.database_name === name);
          if (database) {
            await deleteDatabase(database.database_id, { email, apiKey });
          } else {
            console.warn(`Database ${name} not found`);
          }
        }
        response.Status = "SUCCESS";
        break;
      }
      default: {
        const databases = await getDatabases({ email, apiKey });
        let database = databases.find((db) => db.database_name === name);
        if (database) {
          database = await updateDatabase(database.database_id, {
            email,
            apiKey,
            tls,
            eviction,
            autoUpgrade,
          });
        } else {
          database = await createDatabase({
            email,
            apiKey,
            name,
            region,
            tls,
            eviction,
            autoUpgrade,
          });
        }
        response.Status = "SUCCESS";
        response.Data = {
          redisUrl: `rediss://default:${database.password}@${database.endpoint}:${database.port}`,
          restUrl: `https://${database.endpoint}`,
          restToken: database.rest_token,
          readOnlyRestToken: database.read_only_rest_token,
        };
        break;
      }
    }
    console.log("Response from custom resource:", response);
    return response;
  } catch (error) {
    console.error(error);
    response.Status = "FAILED";
    if (error instanceof Error) {
      response.Reason = error.message;
      response.Data = {
        stack: error.stack,
      };
    } else {
      response.Reason = `Error: ${JSON.stringify(error)}`;
    }
    response.Data = {
      ...response.Data,
      redisUrl: null,
      restUrl: null,
      restToken: null,
      readOnlyRestToken: null,
    };
    return response;
  }
};

interface UpstashRedisDatabase {
  database_id: string;
  database_name: string;
  database_type: string;
  region:
    | "eu-west-1"
    | "us-east-1"
    | "us-west-1"
    | "ap-northeast-1"
    | "us-central-1";
  port: number;
  creation_time: number;
  state: string;
  password: string;
  user_email: string;
  endpoint: string;
  tls: boolean;
  eviction: boolean;
  auto_upgrade: boolean;
  rest_token: string;
  read_only_rest_token: string;
}

async function getDatabases({
  email,
  apiKey,
}: {
  email: string;
  apiKey: string;
}) {
  const response = await fetch("https://api.upstash.com/v2/redis/databases", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to get databases: ${response.status} ${response.statusText}`
    );
  }

  const data: UpstashRedisDatabase[] = await response.json();
  return data;
}

async function deleteDatabase(
  id: string,
  { email, apiKey }: { email: string; apiKey: string }
) {
  const response = await fetch(
    `https://api.upstash.com/v2/redis/database/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to delete database: ${response.status} ${response.statusText}`
    );
  }
}

async function enableTls(
  id: string,
  { email, apiKey }: { email: string; apiKey: string }
) {
  const response = await fetch(
    `https://api.upstash.com/v2/redis/enable-tls/${id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to enable TLS: ${response.status} ${response.statusText}`
    );
  }
}

async function toggleEviction(
  id: string,
  {
    email,
    apiKey,
    eviction,
  }: { email: string; apiKey: string; eviction: boolean }
) {
  const response = await fetch(
    `https://api.upstash.com/v2/redis/${eviction ? "enable" : "disable"}-eviction/${id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to ${eviction ? "enable" : "disable"} eviction: ${response.status} ${response.statusText}`
    );
  }
}

async function toggleAutoUpgrade(
  id: string,
  {
    email,
    apiKey,
    autoUpgrade,
  }: { email: string; apiKey: string; autoUpgrade: boolean }
) {
  const response = await fetch(
    `https://api.upstash.com/v2/redis/${autoUpgrade ? "enable" : "disable"}-autoupgrade/${id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to ${autoUpgrade ? "enable" : "disable"} auto upgrade: ${response.status} ${response.statusText}`
    );
  }
}

async function updateDatabase(
  id: string,
  {
    email,
    apiKey,
    tls,
    eviction,
    autoUpgrade,
  }: {
    email: string;
    apiKey: string;
    tls: boolean;
    eviction: boolean;
    autoUpgrade: boolean;
  }
) {
  const getResponse = await fetch(
    `https://api.upstash.com/v2/redis/database/${id}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
      },
    }
  );
  if (!getResponse.ok) {
    throw new Error(
      `Failed to get database: ${getResponse.status} ${getResponse.statusText}`
    );
  }
  const database: UpstashRedisDatabase = await getResponse.json();

  if (database.tls !== tls) {
    if (tls) {
      await enableTls(id, { email, apiKey });
    }
  }

  if (database.eviction !== eviction) {
    await toggleEviction(id, { email, apiKey, eviction });
  }

  if (database.auto_upgrade !== autoUpgrade) {
    await toggleAutoUpgrade(id, { email, apiKey, autoUpgrade });
  }

  return database;
}

async function createDatabase({
  email,
  apiKey,
  name,
  region,
  tls,
  eviction,
  autoUpgrade,
}: {
  email: string;
  apiKey: string;
  name: string;
  region: string;
  tls: boolean;
  eviction: boolean;
  autoUpgrade: boolean;
}) {
  const response = await fetch("https://api.upstash.com/v2/redis/database", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      region,
      tls,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create database: ${response.status} ${response.statusText}`
    );
  }
  const database: UpstashRedisDatabase = await response.json();

  if (database.tls !== tls) {
    if (tls) {
      await enableTls(database.database_id, { email, apiKey });
    }
  }

  if (database.eviction !== eviction) {
    await toggleEviction(database.database_id, { email, apiKey, eviction });
  }

  if (database.auto_upgrade !== autoUpgrade) {
    await toggleAutoUpgrade(database.database_id, {
      email,
      apiKey,
      autoUpgrade,
    });
  }

  return database;
}
