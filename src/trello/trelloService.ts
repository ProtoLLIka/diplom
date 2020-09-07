import * as TrelloNodeAPI from 'trello-node-api';
import { Injectable } from '@nestjs/common';
const axios = require('axios').default;
import { Task } from 'src/dto/task.dto';
import { testDataSet } from 'src/neural_network/TestDataSet';

export const TRELLO_API_KEY = '9b592061838cab33984abeceaf366c8e';
export const TRELLO_OAUTH_TOKEN = '62833802cf82d37c39eede12970579d24413120c6244878e565e28322e478717'



@Injectable()
export class TrelloService {
    Trello = new TrelloNodeAPI();
    wasConnection = false;

    /**
     * Подключение к доске в таск-менеджере.
     */
    trelloConnection() {
        this.Trello.setApiKey(TRELLO_API_KEY);
        this.Trello.setOauthToken(TRELLO_OAUTH_TOKEN);
        this.wasConnection = true;
    }

    /**
     * Отправляет текст в нейронную сеть для анализа.
     * @param data строка содержащая в себе текст для анализа.
     */
    async getNeuralLabel(data: string): Promise<string> {
        if (data) {
            data = data.replace(/[^a-zа-яё 1-90]/i, "")
            let response = await axios.post('http://localhost:5000/model', { "x": [data] })
            console.log('Text: ' + data + '\nReult Label:' + response.data[0][0][0])
            return response.data[0][0][0]
        }
    }
    /**
     * Создает новую карточке в таск-менеджере.
     * @param cardName название карточки.
     * @param cardDesc описание карточки.
     */
    async createCard(cardName: String, cardDesc: String): Promise<string> {
        let response = await axios.post('https://api.trello.com/1/cards/?idList=5e8afc14400ece502469d077&key=9b592061838cab33984abeceaf366c8e&token=62833802cf82d37c39eede12970579d24413120c6244878e565e28322e478717', {
            'name': cardName,
            'desc': cardDesc
        })
        console.log(response)
        return `Карточка успешно создана:\n<a href="${response.data.shortUrl}"><b>${response.data.name}</b></a>\n${response.data.desc}`
    }
    /**
     * Переносит задачи в другой список.
     * @param task данные задачи.
     * @param cardDesc список, в который перемещается.
     */
    async moveTask(task: Task, toList: string) {
        // let response = await axios.put(`https://api.trello.com/1/cards/${}/?idList=${}&key=9b592061838cab33984abeceaf366c8e&token=62833802cf82d37c39eede12970579d24413120c6244878e565e28322e478717`, {
        // })
        // return response;
    }
    /**
     * Обрабатывает POST запрос из таск-менеджера.
     * @param data тело запроса.
     */
    async addedNewCard(data: string): Promise<Task> {
        try {
            let body = JSON.parse(JSON.stringify(data))
            let task = new Task;
            task.name = body.action.data.card.name;
            task.description = body.action.data.card.desc;
            task.link = body.action.data.card.shortLink;
            task.neuralLabel = await this.getNeuralLabel(task.name + " " + task.description)
            task.trueLabel = null;

            return task;
        } catch{ return; }

    }
}

