// lambda/uploadImage.ts
import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const s3 = new AWS.S3({
  endpoint: 'http://localstack:4566',
  s3ForcePathStyle: true,
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'us-east-1',
});
const bucketName = 'images-bucket';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { filename, fileContent } = JSON.parse(event.body);

    // Salvar o arquivo temporariamente
    const filePath = path.join('/tmp', filename);
    fs.writeFileSync(filePath, Buffer.from(fileContent, 'base64'));

    // Fazer upload para o S3
    const data = await s3
      .upload({
        Bucket: bucketName,
        Key: filename,
        Body: fs.createReadStream(filePath),
        ACL: 'public-read',
      })
      .promise();

    // Remover o arquivo temporário
    fs.unlinkSync(filePath);

    // Salvar metadados no banco de dados
    const image = await prisma.image.create({
      data: {
        filename,
        url: data.Location,
      },
    });

    return {
      statusCode: 201,
      body: JSON.stringify(image),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro ao fazer upload da imagem' }),
    };
  }
};
