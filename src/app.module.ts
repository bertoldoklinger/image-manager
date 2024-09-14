import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [PrismaModule, ImagesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
