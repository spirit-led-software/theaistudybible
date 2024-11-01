export type TursoLocation =
  | 'ams' // Amsterdam, Netherlands
  | 'arn' // Stockholm, Sweden
  | 'atl' // Atlanta, Georgia (US)
  | 'bog' // Bogotá, Colombia
  | 'bom' // Mumbai, India
  | 'bos' // Boston, Massachusetts (US)
  | 'cdg' // Paris, France
  | 'den' // Denver, Colorado (US)
  | 'dfw' // Dallas, Texas (US)
  | 'ewr' // Secaucus, NJ (US)
  | 'eze' // Ezeiza, Argentina
  | 'fra' // Frankfurt, Germany
  | 'gdl' // Guadalajara, Mexico
  | 'gig' // Rio de Janeiro, Brazil
  | 'gru' // São Paulo, Brazil
  | 'hkg' // Hong Kong, Hong Kong
  | 'iad' // Ashburn, Virginia (US)
  | 'jnb' // Johannesburg, South Africa
  | 'lax' // Los Angeles, California (US)
  | 'lhr' // London, United Kingdom
  | 'mad' // Madrid, Spain
  | 'mia' // Miami, Florida (US)
  | 'nrt' // Tokyo, Japan
  | 'ord' // Chicago, Illinois (US)
  | 'otp' // Bucharest, Romania
  | 'phx' // Phoenix, Arizona (US)
  | 'qro' // Querétaro, Mexico
  | 'scl' // Santiago, Chile
  | 'sea' // Seattle, Washington (US)
  | 'sin' // Singapore, Singapore
  | 'sjc' // San Jose, California (US)
  | 'syd' // Sydney, Australia
  | 'waw' // Warsaw, Poland
  | 'yul' // Montreal, Canada
  | 'yyz'; // Toronto, Canada

export type TursoGroup = {
  name: string;
  version: string;
  uuid: string;
  locations: TursoLocation[];
  primary: TursoLocation;
  archived: boolean;
};

export type TursoDatabase = {
  Name: string;
  DbId: string;
  Hostname: string;
  block_reads: boolean;
  block_writes: boolean;
  allow_attach: boolean;
  regions: TursoLocation[];
  primaryRegion: TursoLocation;
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
