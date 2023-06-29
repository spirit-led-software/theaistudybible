import { Test, TestingModule } from '@nestjs/testing';
import { FileScraperService } from './file-scraper.service';

describe('FileScraperService', () => {
  let service: FileScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileScraperService],
    }).compile();

    service = module.get<FileScraperService>(FileScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
