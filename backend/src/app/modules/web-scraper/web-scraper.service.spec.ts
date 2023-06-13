import { Test, TestingModule } from '@nestjs/testing';
import { WebScraperService } from './web-scraper.service';

describe('WebScraperService', () => {
  let service: WebScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebScraperService],
    }).compile();

    service = module.get<WebScraperService>(WebScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
