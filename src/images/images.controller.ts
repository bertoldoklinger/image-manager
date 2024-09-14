import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename: string =
            randomUUID() + path.extname(file.originalname);
          cb(null, filename);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.imagesService.uploadToS3(file.filename);
    const image = await this.imagesService.create(file.filename, url);
    return image;
  }

  @Get()
  async getAllImages() {
    return this.imagesService.findAll();
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
