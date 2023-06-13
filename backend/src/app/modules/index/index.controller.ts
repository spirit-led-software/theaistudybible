import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateWebsiteIndexOperationRequest } from './dto/create-website-index-operation.dto';
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
  async getOperation(@Param('id') id: number) {
    const indexOperation = await this.indexService.getIndexOperation(id);
    return indexOperation;
  }

  @Put(':id/cancel')
  async cancelOperation(@Param('id') id: number) {
    const indexOperation = await this.indexService.cancelIndexOperation(id);
    return indexOperation;
  }

  @Post('website')
  async indexWebsite(@Body() body: CreateWebsiteIndexOperationRequest) {
    const indexOperation = await this.indexService.queueIndexWebsiteOperation(
      body,
    );
    return indexOperation;
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async indexFile(@UploadedFile() file: Express.Multer.File) {
    const indexOperation = await this.indexService.queueIndexFileOperation(
      file,
    );
    return indexOperation;
  }
}
