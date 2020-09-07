import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrelloController } from './trello/trello.controller';
import { TelegramService } from './telegram/telegramService';
import { TrelloService } from './trello/trelloService';
import { DataBaseService, dbConfig, dbEntities } from './db/dataBaseService';
import { NeuralNetwortService } from './neural_network/NeuralNetworkService';
@Module({
  imports: [ConfigModule.forRoot(),
    // TypeOrmModule.forRootAsync(dbConfig),
    TypeOrmModule.forFeature(dbEntities),],
  controllers: [AppController, TrelloController],
  providers: [AppService, TrelloService, TelegramService, DataBaseService, NeuralNetwortService],
})
export class AppModule {}
  