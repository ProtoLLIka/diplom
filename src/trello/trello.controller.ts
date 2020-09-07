import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegramService'
import { TrelloService } from 'src/trello/trelloService';
import { DataBaseService } from 'src/db/dataBaseService';
const axios = require('axios').default;
@Controller('trello')
export class TrelloController {
  constructor(private trelloService: TrelloService,
    private telegramService: TelegramService,
    private dataBaseService: DataBaseService) { }
  @Get()
  async findAll(@Query() q: string): Promise<any> {
    return 'This trello controller';
  }

  /**
   * Получает запросы от таск-менеджера.
   */
  @Post()
  async ConnectURL(@Body() body: string) {
    if (JSON.parse(JSON.stringify(body)).action.type == 'createCard') {
      this.dataBaseService.addTask(await this.trelloService.addedNewCard(body));
    }
  }


}
