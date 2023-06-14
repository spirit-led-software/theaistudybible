import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateWebsiteIndexOperationDto } from './dto/create-website-index-operation.dto';
import { IndexService } from './index.service';

@Controller('index-operations')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Get()
  async getIndexOperations() {
    const indexOperations = await this.indexService.getIndexOperations();
    return indexOperations;
  }

  @Get(':id')
  async getOperation(@Param('id') id: string) {
    const indexOperation = await this.indexService.getIndexOperation(+id);
    if (!indexOperation) {
      throw new NotFoundException();
    }
    return indexOperation;
  }

  @Put(':id/cancel')
  async cancelOperation(@Param('id') id: string) {
    const indexOperation = await this.indexService.cancelIndexOperation(+id);
    return indexOperation;
  }

  @Post('website')
  async indexWebsite(@Body() body: CreateWebsiteIndexOperationDto) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }
    const { job, indexOperation } =
      await this.indexService.queueIndexWebsiteOperation(body);
    return { job, indexOperation };
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async indexFile(@UploadedFile() file: Express.Multer.File) {
    const { job, indexOperation } =
      await this.indexService.queueIndexFileOperation(file);
    return { job, indexOperation };
  }
}
