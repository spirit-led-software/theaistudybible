import { Expose } from 'class-transformer';

export class IndexOperationDto {
  @Expose()
  id: number;

  @Expose()
  type: string;

  @Expose()
  status: string;

  @Expose()
  metadata: string;

  @Expose()
  created: Date;

  @Expose()
  updated: Date;
}
