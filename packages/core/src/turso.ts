import { createClient } from '@tursodatabase/api';
import { Resource } from 'sst';

export const turso = createClient({
  org: Resource.TursoOrg.value,
  token: Resource.TursoApiToken.value,
});
