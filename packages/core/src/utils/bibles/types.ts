export interface DBLMetadata {
  identification: Identification;
  type: Type;
  relationships: string;
  agencies: Agencies;
  language: Language;
  countries:
    | {
        country: Country;
      }
    | Country[];
  format: Format;
  names: Names;
  manifest: Manifest;
  source: Source;
  publications: Publications;
  copyright: Copyright;
  promotion: Promotion;
  archiveStatus: ArchiveStatus;
  '@_version': string;
  '@_id': string;
  '@_revision': string;
}

export interface ArchiveStatus {
  archivistName: string;
  dateArchived: string;
  dateUpdated: string;
  comments: string;
}

export interface Promotion {
  promoVersionInfo: PromoVersionInfo;
}

export interface PromoVersionInfo {
  p: string;
  '@_contentType': string;
}

export interface Copyright {
  fullStatement: FullStatement;
}

export interface FullStatement {
  statementContent: StatementContent;
}

export interface StatementContent {
  p: string;
  '@_type': string;
}

export interface Publications {
  publication: Publication[];
}

export interface Publication {
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  abbreviation: string;
  abbreviationLocal: string;
  canonicalContent: CanonicalContent;
  structure: Structure2;
  '@_id': string;
  '@_default'?: string;
}

export interface Structure2 {
  content: Content2[];
}

export interface Content2 {
  '@_name': string;
  '@_src': string;
  '@_role': string;
}

export interface Source {
  canonicalContent: CanonicalContent;
  structure: Structure;
}

export interface Structure {
  content: Content;
}

export interface Content {
  '@_src': string;
  '@_role': string;
}

export interface CanonicalContent {
  book: Book[];
}

export interface Book {
  '@_code': string;
}

export interface Manifest {
  resource: Resource[];
}

export interface Resource {
  '@_checksum': string;
  '@_mimeType': string;
  '@_size': string;
  '@_uri': string;
}

export interface Names {
  name: Name[];
}

export interface Name {
  abbr: string;
  short: string;
  long: string;
  '@_id': string;
}

export interface Format {
  usxVersion: number;
  versedParagraphs: boolean;
}

export interface Country {
  iso: string;
  name: string;
}

export interface Language {
  iso: string;
  name: string;
  nameLocal: string;
  script: string;
  scriptCode: string;
  scriptDirection: 'LTR' | 'RTL';
  ldml: string;
  rod: number;
  numerals: string;
}

export interface Agencies {
  rightsHolder: RightsHolder;
  rightsAdmin: RightsAdmin;
  contributor: Contributor;
}

export interface Contributor {
  content: boolean;
  publication: boolean;
  management: boolean;
  finance: boolean;
  qa: boolean;
  uid: string;
  name: string;
}

export interface RightsAdmin {
  url: string;
  uid: string;
  name: string;
}

export interface RightsHolder {
  abbr: string;
  url: string;
  nameLocal: string;
  uid: string;
  name: string;
}

export interface Type {
  medium: string;
  isConfidential: boolean;
  hasCharacters: boolean;
  isTranslation: boolean;
  isExpression: boolean;
  translationType: string;
  audience: string;
  projectType: string;
}

export interface Identification {
  name: string;
  nameLocal: string;
  description: string;
  abbreviation: string;
  abbreviationLocal: string;
  scope: string;
  dateCompleted: string;
  bundleProducer: string;
  systemId: SystemId[];
}

export interface SystemId {
  id: string;
  csetId?: string;
  name?: string;
  fullName?: string;
  '@_type': string;
}

export interface Xml {
  '@_version': string;
  '@_standalone': string;
}
