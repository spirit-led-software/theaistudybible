import { CreateWebsiteIndexOperationDto } from '@dtos/index-operation';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { paginateEntityList } from '@utils/pagination';
import { IndexOpService } from './index-op.service';

@Controller('index-operations')
export class IndexOpController {
  constructor(private readonly indexService: IndexOpService) {}

  @Get()
  async getIndexOperations(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const indexOperations = await this.indexService.getIndexOperations();
    return paginateEntityList(indexOperations, +page, +limit);
  }

  @Get(':id')
  async getOperation(@Param('id') id: string) {
    const indexOperation = await this.indexService.getIndexOperation(id);
    if (!indexOperation) {
      throw new NotFoundException();
    }
    return indexOperation;
  }

  @Put(':id/cancel')
  async cancelOperation(@Param('id') id: string) {
    const indexOperation = await this.indexService.cancelIndexOperation(id);
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
  async indexFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('prettyName') prettyName: string,
  ) {
    const { job, indexOperation } =
      await this.indexService.queueIndexFileOperation(file, prettyName);
    return { job, indexOperation };
  }
}
