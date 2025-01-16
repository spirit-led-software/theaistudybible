import type * as schema from '@/core/database/schema';
import { turso } from '@/core/turso';
import type { Client } from '@libsql/client-wasm';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { murmurHash } from 'ohash';
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import type { Accessor, ParentProps } from 'solid-js';
import { Resource } from 'sst';
import { requireAuth } from '../server/auth';
import { useAuth } from './auth';

export type LocalDbContextType = {
  db: Accessor<LibSQLDatabase<typeof schema> | undefined>;
  client: Accessor<Client | undefined>;
};

export const LocalDbContext = createContext<LocalDbContextType>();

export const getOrCreateUserDb = GET(async () => {
  'use server';
  const { user } = requireAuth();
  try {
    const hash = murmurHash(user.id).toString(36);
    const dbName = `${Resource.App.name}-${Resource.App.stage}-${hash}`;
    try {
      const db = await turso.databases.get(dbName);
      const token = await turso.databases.createToken(db.name, {
        authorization: 'full-access',
      });
      return {
        url: `libsql://${db.hostname}`,
        token: token.jwt,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 404
      ) {
        const newDb = await turso.databases.create(dbName, {
          schema: Resource.TursoDatabaseSchema.name,
          group: Resource.TursoGroup.name,
        });
        const token = await turso.databases.createToken(newDb.name, {
          authorization: 'full-access',
        });
        return {
          url: `libsql://${newDb.hostname}`,
          token: token.jwt,
        };
      }
      console.error(error);
      throw error;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
});

export const LocalDbProvider = (props: ParentProps) => {
  const { session } = useAuth();

  const [client, setClient] = createSignal<Client>();
  const [db, setDb] = createSignal<LibSQLDatabase<typeof schema>>();

  const dbQuery = createQuery(() => ({
    queryKey: ['user-db'],
    queryFn: () => getOrCreateUserDb(),
    enabled: !!session(),
    staleTime: 1000 * 60 * 60 * 24,
  }));

  onMount(() => {
    if (session()) {
      navigator.storage.persist();
    }
  });

  createEffect(async () => {
    const currentSession = session();
    if (!currentSession) {
      console.log('No session');
      return;
    }

    console.log('Creating local db');
    try {
      const { createLocalDb } = new ComlinkWorker<typeof import('../workers/local-db')>(
        new URL('../workers/local-db', import.meta.url),
        { type: 'module' },
      );

      if (dbQuery.status === 'success') {
        console.log('Creating local db with dbQuery', {
          syncUrl: dbQuery.data.url,
        });

        const result = await Promise.race([
          createLocalDb({
            url: 'file:local.db?vfs=opfs',
            syncUrl: dbQuery.data.url,
            token: dbQuery.data.token,
            encryptionKey: currentSession.id,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('createLocalDb timeout')), 10000),
          ),
        ]);

        const { client, db } = result as Awaited<ReturnType<typeof createLocalDb>>;
        setClient(client);
        setDb(db);
        console.log('Created local db successfully');
      } else {
        console.log('Creating local db without dbQuery');
        const { client, db } = await createLocalDb({
          url: 'file:local.db?vfs=opfs',
        });
        setClient(client);
        setDb(db);
        console.log('Created local db');
      }
    } catch (error) {
      console.error('Failed to create local db:', error);
      // Optionally implement retry logic here
    }
  });

  createEffect(() => {
    const currentClient = client();
    if (currentClient) {
      const interval = setInterval(() => currentClient.sync(), 30_000);
      onCleanup(() => clearInterval(interval));
    }
  });

  return <LocalDbContext.Provider value={{ db, client }}>{props.children}</LocalDbContext.Provider>;
};

export const useLocalDb = () => {
  const context = useContext(LocalDbContext);
  if (!context) {
    throw new Error('useLocalDb must be used within a LocalDbProvider');
  }
  return context;
};
