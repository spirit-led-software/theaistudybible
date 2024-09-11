import type { TURSO_LOCATIONS } from './constants';

export type TursoLocationId = keyof typeof TURSO_LOCATIONS;
export type TursoLocationName = (typeof TURSO_LOCATIONS)[TursoLocationId];

export type TursoLocation = {
  id: TursoLocationId;
  name: TursoLocationName;
};

export type TursoGroup = {
  name: string;
  version: string;
  uuid: string;
  locations: TursoLocationId[];
  primary: TursoLocationId;
  archived: boolean;
};

export type TursoDatabase = {
  Name: string;
  DbId: string;
  Hostname: string;
  block_reads: boolean;
  block_writes: boolean;
  allow_attach: boolean;
  regions: TursoLocationId[];
  primaryRegion: TursoLocationId;
  type: string;
  version: string;
  group: string;
  is_schema: boolean;
  schema: string;
  sleeping: boolean;
};

export type TursoDatabaseConfiguration = {
  size_limit: `${number}`;
  allow_attach: boolean;
  block_reads: boolean;
  block_writes: boolean;
};

export type TursoDatabaseSeedOptions = {
  timestamp?: string;
} & (
  | {
      type: 'database';
      name: string;
    }
  | {
      type: 'dump';
      url: string;
    }
);
