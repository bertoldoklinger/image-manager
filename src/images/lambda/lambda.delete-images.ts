// lambda/deleteImage.ts
import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

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
    const { id } = event.pathParameters;
    const image = await prisma.image.findUnique({ where: { id: id } });

    if (!image) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Imagem não encontrada' }),
      };
    }

    // Deletar do S3
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: image.filename,
      })
      .promise();

    // Deletar do banco de dados
    await prisma.image.delete({ where: { id: id } });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Imagem deletada com sucesso' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro ao deletar a imagem' }),
    };
  }
};
