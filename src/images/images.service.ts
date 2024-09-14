import { Injectable } from '@nestjs/common';
import { Image } from '@prisma/client';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImagesService {
  private s3: AWS.S3;
  private bucketName = 'images-bucket';

  constructor(private prisma: PrismaService) {
    this.s3 = new AWS.S3({
      endpoint: 'http://localstack:4566', // Nome do serviço no Docker Compose
      s3ForcePathStyle: true,
      accessKeyId: 'test',
      secretAccessKey: 'test',
      region: 'us-east-1',
    });
  }

  async uploadToS3(filename: string): Promise<string> {
    const filePath = path.join(__dirname, '../../uploads', filename);
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: this.bucketName,
      Key: filename,
      Body: fileContent,
      ACL: 'public-read',
    };

    const data = await this.s3.upload(params).promise();

    // Opcional: Remover o arquivo local após o upload
    fs.unlinkSync(filePath);

    return data.Location;
  }

  async create(filename: string, url: string): Promise<Image> {
    return this.prisma.image.create({
      data: { filename, url },
    });
  }

  async findAll(): Promise<Image[]> {
    return this.prisma.image.findMany();
  }

  async remove(id: string): Promise<Image> {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (image) {
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: image.filename,
        })
        .promise();
      return this.prisma.image.delete({
        where: { id },
      });
    }
    throw new Error('Image not found');
  }
}
