import * as message from 'src/message/message';
import { CronJob } from 'cron';
import { DevList, InfList } from 'src/db/dbImitation'
import Telegraf from 'telegraf';
import { TrelloService, TRELLO_API_KEY, TRELLO_OAUTH_TOKEN } from 'src/trello/trelloService';
import { User } from 'src/dto/user.dto';
import { UserRole } from 'src/dto/user_role.dto';
import { DataBaseService } from 'src/db/dataBaseService';
import { isNull } from 'util';
import { Task } from 'src/dto/task.dto';
import { InlineKeyboardMarkup, InlineKeyboardButton } from 'telegraf/typings/telegram-types';
import { NeuralNetwortService } from 'src/neural_network/NeuralNetworkService';
import { Injectable } from '@nestjs/common';
const axios = require('axios').default;
const SocksAgent = require('socks5-https-client/lib/Agent');
const BOT_TOKEN = '1101937644:AAGpcksRnpcVthFgFTP4Rz5FJ1_H8IjVFi8';
/////////////////////////////////////////////////////////////// НЕ ЗАБЫТЬ СКРЫТЬ ИНФОРМАЦИЮ О ПРОКСИ
type Status = 'none' | 'test' | 'registration' | 'verification' | 'newcard' | 'newcarddesc' | 'newcardAccept';
enum keyBoards {
    registration,
    neuralNetworkTest,
    exit,
    labelAccept,
    acceptNewCard,
    nonDescription
};

@Injectable()
export class TelegramService {
    state: { [id: string]: Status; } = {};
    keyAccess = 'klqOMgfM8x'
    bot: Telegraf<any>;
    wasConnection = false;
    itWas = false;
    tmpTask = new Task();
    roles = { "roles": [] };
    cardName = ''
    cardDesc = ''
    /**
     * Возвращает клавиатуру для сообщения
     * @param type тип клавиатуры
     */
    getKeyboard(type: keyBoards) {

        switch (type) {
            case keyBoards.neuralNetworkTest:
                return {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Да', callback_data: `nnCorrect` },
                            { text: '❌ Нет', callback_data: `nnNotCorrect` }]
                        ]
                    }
                };
            case keyBoards.labelAccept:
                return {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Да', callback_data: `labelAccept` },
                            { text: '❌ Нет', callback_data: `labelNotAccept` }],
                            [{ text: 'Нужно больше информации', callback_data: `moreInf` }]
                        ]
                    },
                };
            case keyBoards.registration:
                return {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `backend${this.roles.roles.some(o => o == 'backDeveloper') ? '✅' : '❌'}`, callback_data: 'backend' },
                            { text: `frontend${this.roles.roles.some(o => o == 'frontDeveloper') ? '✅' : '❌'}`, callback_data: 'frontend' }],
                            [{ text: `Поддержка${this.roles.roles.some(o => o == 'supporter') ? '✅' : '❌'}`, callback_data: 'supporter' }],
                            [{ text: `${this.roles.roles.length > 0 ? '✅' : '❌'}`, callback_data: `ExitRegistration` }]
                        ]
                    }
                }
            case keyBoards.exit:
                return {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌', callback_data: `ExitRegistration` }]
                        ]
                    }
                }
            case keyBoards.acceptNewCard:
                return {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Да', callback_data: `cardCreate` },
                            { text: '❌ Нет', callback_data: `cardNotCreate` }]
                        ]
                    }
                }
            case keyBoards.nonDescription:
                return {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Без описания', callback_data: `nonDescrition` }]
                        ]
                    }
                }
            default:
                break;
        }
    }

    public constructor(
        private tService: TrelloService,
        private dataBaseService: DataBaseService,
        private nnService: NeuralNetwortService,
    ) {
        /**
        * Подключений к боту
        */
        this.bot = new Telegraf(BOT_TOKEN, {

        });
        /**
         * Обработчик фотографий
         */
        this.bot.on('photo', async (ctx) => {
            const chatId = ctx.chat.id;
            this.bot.telegram.sendMessage(chatId, 'Прошу прощения, но фото я не обрабатываю')
        });
        /**
        * Обработчик стикров
        */
        this.bot.on('sticker', async (ctx) => {
            const chatId = ctx.chat.id;
            this.bot.telegram.sendMessage(chatId, 'Стикеры это конечно здорово, но их я не обрабатываю')
        });
        /**
        * Обработчик нажатий на кнопку
        */
        this.bot.on('callback_query', async (ctx) => {
            console.log('From: ' + ctx.update.callback_query.from.first_name, ctx.update.callback_query.from.last_name, '\nCallback_query: ' + ctx.update.callback_query.data, '\nTime: ' + new Date().getHours() + ':' + new Date().getMinutes() + '\n')
            switch (ctx.update.callback_query.data) {
                case 'labelAccept': {
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                    let newTasks = await (await this.dataBaseService.getAllTaskes()).find(o => isNull(o.trueLabel))
                    if (newTasks) {
                        nnService.addNewRaw(newTasks.name + ' ' + newTasks.description, newTasks.neuralLabel);
                        newTasks.trueLabel = newTasks.neuralLabel
                        await dataBaseService.addTask(newTasks)
                        this.sendNewCardMessage()
                    } else {
                        this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, 'Новых задач нет')
                    }

                    break;
                }
                case 'labelNotAccept': {
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                    let newTasks = await (await this.dataBaseService.getAllTaskes()).find(o => isNull(o.trueLabel))
                    if (newTasks) {
                        newTasks.trueLabel = newTasks.neuralLabel == 'front' ? 'back' : 'front'
                        nnService.addNewRaw(newTasks.name + ' ' + newTasks.description, newTasks.trueLabel);
                        await dataBaseService.addTask(newTasks)
                        this.sendNewCardMessage()
                    } else {
                        this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, 'Новых задач нет')
                    }
                    break;
                }
                case 'moreInf': {
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                    let newTasks = await (await this.dataBaseService.getAllTaskes()).find(o => isNull(o.trueLabel))
                    if (newTasks) {
                        newTasks.trueLabel = 'moreInf'
                        await dataBaseService.addTask(newTasks)
                        // await tService.moveTask(newTasks)
                        this.sendNewCardMessage()
                    } else {
                        this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, 'Новых задач нет')
                    }
                    break;
                }
                case 'nnCorrect': {
                    this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, '😄 Я молодец!')
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id)
                    break;
                }
                case 'nnNotCorrect': {
                    this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, '😔 Что ж, буду знать...')
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id)
                    break;
                }
                case 'backend': {

                    if (this.roles.roles.some(o => o == 'backDeveloper')) {
                        let index = this.roles.roles.indexOf('backDeveloper', 0)
                        if (index >= 0) {
                            this.roles.roles.splice(index, 1);
                        }
                    } else {
                        this.roles.roles.push('backDeveloper');
                    }
                    const oneButtonOptions = {
                        inline_keyboard: [
                            [{ text: `backend${this.roles.roles.some(o => o == 'backDeveloper') ? '✅' : '❌'}`, callback_data: 'backend' },
                            { text: `frontend${this.roles.roles.some(o => o == 'frontDeveloper') ? '✅' : '❌'}`, callback_data: 'frontend' }],
                            [{ text: `Поддержка${this.roles.roles.some(o => o == 'supporter') ? '✅' : '❌'}`, callback_data: 'supporter' }],
                            [{ text: `${this.roles.roles.length > 0 ? '✅' : '❌'}`, callback_data: `ExitRegistration` }]
                        ]
                    };
                    await this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id, undefined, JSON.stringify(oneButtonOptions));

                    console.log(this.roles.roles)
                    break;
                }
                case 'frontend': {
                    if (this.roles.roles.some(o => o == 'frontDeveloper')) {
                        let index = this.roles.roles.indexOf('frontDeveloper', 0)
                        if (index >= 0) {
                            this.roles.roles.splice(index, 1);
                        }
                    } else {
                        this.roles.roles.push('frontDeveloper');
                    }
                    const oneButtonOptions = {
                        inline_keyboard: [
                            [{ text: `backend${this.roles.roles.some(o => o == 'backDeveloper') ? '✅' : '❌'}`, callback_data: 'backend' },
                            { text: `frontend${this.roles.roles.some(o => o == 'frontDeveloper') ? '✅' : '❌'}`, callback_data: 'frontend' }],
                            [{ text: `Поддержка${this.roles.roles.some(o => o == 'supporter') ? '✅' : '❌'}`, callback_data: 'supporter' }],
                            [{ text: `${this.roles.roles.length > 0 ? '✅' : '❌'}`, callback_data: `ExitRegistration` }]
                        ]
                    };
                    await this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id, undefined, JSON.stringify(oneButtonOptions));

                    console.log(this.roles.roles)
                    break;
                }
                case 'supporter': {
                    if (this.roles.roles.some(o => o == 'supporter')) {
                        let index = this.roles.roles.indexOf('supporter', 0)
                        if (index >= 0) {
                            this.roles.roles.splice(index, 1);
                        }
                    } else {
                        this.roles.roles.push('supporter');
                    }
                    const oneButtonOptions = {
                        inline_keyboard: [
                            [{ text: `backend${this.roles.roles.some(o => o == 'backDeveloper') ? '✅' : '❌'}`, callback_data: 'backend' },
                            { text: `frontend${this.roles.roles.some(o => o == 'frontDeveloper') ? '✅' : '❌'}`, callback_data: 'frontend' }],
                            [{ text: `Поддержка${this.roles.roles.some(o => o == 'supporter') ? '✅' : '❌'}`, callback_data: 'supporter' }],
                            [{ text: `${this.roles.roles.length > 0 ? '✅' : '❌'}`, callback_data: `ExitRegistration` }]
                        ]
                    };
                    await this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id, undefined, JSON.stringify(oneButtonOptions));

                    console.log(this.roles.roles)
                    break;
                }
                case 'nonDescrition': {
                    this.tmpTask.description = "";
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                    this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, `Создать карточку?\n<b>${this.cardName}</b>\n${this.cardDesc}`, {
                        parse_mode: 'HTML',
                        ...this.getKeyboard(keyBoards.acceptNewCard)
                    })
                    this.state[ctx.update.callback_query.from.id] = 'none';
                    break;
                }
                case 'cardCreate': {
                    let msg = await tService.createCard(this.cardName, this.cardDesc);
                    this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, msg, { parse_mode: 'HTML' });
                    this.cardName = '';
                    this.cardDesc = '';
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                    break;
                }
                case 'cardNotCreate': {
                    this.cardName = '';
                    this.cardDesc = '';
                    this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, 'Создание карточки отмененно');
                    this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                    break;
                }
                case 'ExitRegistration': {
                    if (this.roles.roles.length == 0) {

                        this.state[ctx.update.callback_query.from.id] = 'none';
                        this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                        this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, 'Регистарция отменена')
                    } else {
                        let user = new User()
                        user.name = ctx.update.callback_query.from.first_name
                        user.surname = ctx.update.callback_query.from.last_name
                        user.telegramId = ctx.update.callback_query.from.id
                        user.dutyDay = 0
                        user = await dataBaseService.addUser(user);

                        this.roles.roles.forEach(async el => {
                            let userRole = new UserRole
                            userRole.idUser = user.id
                            userRole.idRole = await dataBaseService.getRoleId(el)
                            dataBaseService.addUserRole(userRole)
                        });
                        this.roles = { "roles": [] };
                        this.bot.telegram.editMessageReplyMarkup(ctx.update.callback_query.from.id, ctx.update.callback_query.message.message_id);
                        this.bot.telegram.sendMessage(ctx.update.callback_query.from.id, 'Регистарция завершена');
                        this.state[ctx.update.callback_query.from.id] = 'none';
                    }
                    break
                }
            }
        });
        /**
         * Обработчик сообщений
         */
        this.bot.on('message', async (ctx) => {
            nnService.getFileData();
            const chatId = ctx.chat.id;
            if (!(await dataBaseService.getAllUsers()).some(o => o.telegramId == chatId)
                && ctx.update.message.text != '/neural'
                && this.state[chatId] != 'test') {
                this.bot.telegram.sendMessage(chatId, 'Извините, но для незарегистрированных пользователей доступна только команда /neural');
                return;
            }
            console.log('From: ' + ctx.update.message.from.first_name, ctx.update.message.from.last_name, '\nMessage: ' + ctx.message.text, '\nTime: ' + new Date().getHours() + ':' + new Date().getMinutes() + '\n')

            if (ctx.update.message.text === '/stopall') {
                this.state[chatId] = 'none';
                this.bot.telegram.sendMessage(chatId, 'Все процесс прекращены.\nГотов к работе...')
                return;
            }
            if (this.state[chatId] === 'test' && ctx.update.message.text !== '/neural') {
                let label = await this.tService.getNeuralLabel(ctx.message.text)
                this.bot.telegram.sendMessage(chatId, 'Я определил, что это:\n' + (label == 'front' ? 'Front-end задача' : 'Back-end задача'), this.getKeyboard(keyBoards.neuralNetworkTest));
                this.state[ctx.update.message.from.id] = 'none';
                return;
            }
            if (this.state[chatId] === 'registration' && ctx.update.message.text != '') {
                this.bot.telegram.sendMessage(chatId, 'Прошу, сосредоточьтесь на выборе ролей')
            }
            if (this.state[chatId] === 'verification' && ctx.update.message.text !== '/registration') {

                if (ctx.update.message.text === this.keyAccess) {
                    this.state[chatId] = 'registration';
                    this.roles = { "roles": [] };
                    this.bot.telegram.sendMessage(chatId,
                        'Выберите вашу роль (или роли)\nКак выберите все нужные, нажмите на галочку или на крестик что бы выйти', this.getKeyboard(keyBoards.registration))
                } else {
                    this.bot.telegram.sendMessage(chatId,
                        'Неверный ключ доступа. Попробуйте заново или нажмите на крестик, чтобы выйти', this.getKeyboard(keyBoards.exit))
                }
            }
            if (this.state[chatId] === 'newcarddesc') {
                this.cardDesc = ctx.update.message.text;
                this.bot.telegram.sendMessage(chatId, `Создать карточку?\n<b>${this.cardName}</b>\n${this.cardDesc}`, {
                    parse_mode: 'HTML',
                    ...this.getKeyboard(keyBoards.acceptNewCard)
                })
                this.state[chatId] = 'none';
            }
            if (this.state[chatId] === 'newcard') {
                this.cardName = ctx.update.message.text;
                this.bot.telegram.sendMessage(chatId, 'Напишите описание задачи:', this.getKeyboard(keyBoards.nonDescription))
                this.state[chatId] = 'newcarddesc';
            }
            switch (ctx.message.text) {
                case '/neural': {
                    this.state[chatId] = 'test';
                    this.bot.telegram.sendMessage(chatId, 'Напишите текст сообщения:')
                    break;
                }
                case '/accuracy': {
                    let acc = await nnService.getNeuralNetAccuracy()
                    this.bot.telegram.sendMessage(chatId, acc.toString())
                    break;
                }
                case '/start': {
                    this.state[chatId] = 'none';
                    this.bot.telegram.sendMessage(chatId, 'Привет, ' + ctx.update.message.from.first_name + message.greetings)
                    break;
                }
                case '/help': {
                    this.bot.telegram.sendMessage(chatId, 'Вот список команд, которые можно использовать:' + message.commands)
                    break;
                }
                case '/frontend': {
                    if ((await dataBaseService.getAllUsers()).some(e => e.telegramId == chatId)) {
                        this.bot.telegram.sendMessage(chatId, await this.getDevMessage(true), { parse_mode: 'HTML' })
                    }
                    break;
                }
                case '/backend': {
                    if ((await dataBaseService.getAllUsers()).some(e => e.telegramId == chatId)) {
                        this.bot.telegram.sendMessage(chatId, await this.getDevMessage(false), { parse_mode: 'HTML' })
                    }
                    break;
                }
                case '/support': {
                    if ((await dataBaseService.getAllUsers()).some(e => e.telegramId == chatId)) {
                        this.bot.telegram.sendMessage(chatId, await this.getSupportMsg(), { parse_mode: 'HTML' })
                    }
                    break;
                }
                case '/registration': {
                    // if ((await dataBaseService.getAllUsers()).filter(o => o.telegramId == chatId).length > 0) {
                    //     this.bot.telegram.sendMessage(chatId, 'Вы уже зарегистрированы. За изменениями в профиле обратитесь к администратору.');
                    //     break;
                    // }
                    this.state[chatId] = 'verification';
                    this.bot.telegram.sendMessage(chatId,
                        'Отлично!\nОтправьте мне, пожалуйста, <b>ключ доступа</b>:', { parse_mode: 'HTML' })
                    break;
                }
                case '/splitnow': {
                    if ((await dataBaseService.getAllUsersByRole('spliter')).filter(o => o.telegramId == chatId).length > 0) {
                        await this.sendNewCardMessage();
                    } else {
                        this.bot.telegram.sendMessage(chatId, 'Прошу прощения, но Вы не распределитель.')
                    }
                    break;
                }
                case '/newcard': {
                    this.state[chatId] = 'newcard';
                    this.bot.telegram.sendMessage(chatId, 'Введите название задачи:', { parse_mode: 'HTML' })
                    break;
                }
                default: {
                    break;
                }
            }
        });

        this.bot.launch();
        this.wasConnection = true;

        this.developDailySending.start();
        this.suppotDailySendingAt10.start();
        this.suppotDailySendingAt14.start();
        this.suppotDailySendingAt16.start();
    }

    /**
     * Взятие не распределенной задачи и формирование сообщения
     */
    async sendNewCardMessage() {
        let newTasks = await (await this.dataBaseService.getAllTaskes()).find(o => isNull(o.trueLabel));
        let allSpliters = await this.dataBaseService.getAllUsersByRole('spliter');
        if (!newTasks) {
            if (this.itWas) {
                allSpliters.forEach(user => {
                    this.bot.telegram.sendMessage(user.telegramId, 'Задач больше нет', { parse_mode: 'HTML' });
                });
                this.itWas = false;
            }
            return;
        }
        this.itWas = true;
        allSpliters.forEach(async user => {
            await this.bot.telegram.sendMessage(user.telegramId,
                '<b>-' + newTasks.name + '-</b>\n'
                + newTasks.description
                + '\n\nОпределенно, что это категория <b>'
                + ((newTasks.neuralLabel == 'front') ? 'Front-end' : 'Back-end')
                + '</b>',
                {
                    parse_mode: 'HTML',
                    ...this.getKeyboard(keyBoards.labelAccept)
                });
        });
    }
    //#region Настройка времени для рассылки сообщений поддержке
    // Рассылка разработчикам каждый день с ПН до ПТ в 10:`10
    developDailySending = new CronJob('00 10 10 * * 1-5', function () {
        this.frontMailing()
        this.backMailing()
    });

    // Рассылка суппортерам каждый день с ПН до ПТ в 10 часов
    suppotDailySendingAt10 = new CronJob('0 0 10 * * 1-5', function () {
        this.supportMailing()
        this.sendNewCardMessage();
    });

    // Рассылка суппортерам каждый день с ПН до ПТ в 14 часов
    suppotDailySendingAt14 = new CronJob('0 0 14 * * 1-5', function () {
        this.supportMailing()
        this.sendNewCardMessage();
    });

    // Рассылка суппортерам каждый день с ПН до ПТ в 16 часов
    suppotDailySendingAt16 = new CronJob('0 0 16 * * 1-5', function () {
        this.supportMailing()
        this.sendNewCardMessage();
    });
    //#endregion

    //#region Фильтры на наличие меток
    //Фильтр на наличие метки 'front-end'
    isFrontLabel = (element) => {
        return (element.labels.some(e => e.name === 'front-end'));
    };
    //Фильтр на наличие метки 'back-end'
    isBackLabel = (element) => {
        return (element.labels.some(e => e.name === 'back-end'));
    };
    //Фильтр на отсутствие метки 'Консультация'
    isNotConsulLabel = (element) => {
        return !(element.labels.some(e => e.name === 'Консультация'));
    };
    //Фильтр на наличие метки 'Консультация'
    isConsulLabel = (element) => {
        return (element.labels.some(e => e.name === 'Консультация'));
    };
    //#endregion

    /**
     * Получение из таск менеджера все карты для "Поддержки"
     */
    async getSupportCards() {
        try {
            return (await axios.get('https://api.trello.com/1/lists/' + InfList.trelloId + '/cards?key=' + TRELLO_API_KEY + '&token=' + TRELLO_OAUTH_TOKEN)).data
        } catch{
            console.log('Exeption on GET req to Trello to get cards')
            return null;
        }
    }
    /**
     * Получение сообщения для "Поддержки"
     */
    async getSupportMsg(): Promise<string> {
        let taskes = await this.getSupportCards();
        let msg = 'Задачи, требующие больше информации:\n\n'
        console.log(taskes)
        if (!taskes) {
            return 'Задач нет';
        }
        let num = 1
        taskes.forEach(element => {
            msg += (num + '. <a href="' + element.url + '"><b>' + element.name + '</b></a>\n' + element.desc + '\n')
            num++;
        });
        return msg;
    }
    /**
     * Рассылка всем пользователям "Поддержка"
     */
    async supportMailing() {
        let allSupporters = await (await this.dataBaseService.getAllUsersByRole('supporter'));
        let msg = await this.getSupportMsg();
        if (!isNull(msg)) {
            allSupporters.forEach(async supporter => {
                await this.bot.telegram.sendMessage(supporter.telegramId, msg, { parse_mode: 'HTML' })
            });
        }
    }
    /**
     * Получение из таск менеджера все карты для "Front-end"
     */
    async getFrontCards() {
        try {
            let taskes = (await axios.get('https://api.trello.com/1/lists/' + DevList.trelloId + '/cards?key=' + TRELLO_API_KEY + '&token=' + TRELLO_OAUTH_TOKEN)).data.filter(o => o.labels.some(e => e.name == 'front-end'))
            if (!taskes) {
                return 'Задач нет';
            } else {
                return taskes;
            }
        } catch{
            console.log('Exeption on GET req to Trello to get cards')
            return null;
        }
    }
    /**
    * Получение из таск менеджера все карты для "Back-end"
    */
    async getBackCards() {
        try {
            let taskes = (await axios.get('https://api.trello.com/1/lists/' + DevList.trelloId + '/cards?key=' + TRELLO_API_KEY + '&token=' + TRELLO_OAUTH_TOKEN)).data.filter(o => o.labels.some(e => e.name == 'back-end'))
            if (!taskes) {
                return 'Задач нет';
            } else {
                return taskes;
            }
        } catch{
            console.log('Exeption on GET req to Trello to get cards')
            return null;
        }
    }
    /**
     * Рассылка всем Front-end разработчикам
     */
    async frontMailing() {
        let allFront = await this.dataBaseService.getAllUsersByRole('frontDeveloper');
        let message = await this.getDevMessage(true)
        console.log(message)
        allFront.forEach(async fronter => {
            await this.bot.telegram.sendMessage(fronter.telegramId, (message != null ? message : 'Сейчас задач нет'), { parse_mode: 'HTML' })
        });
    }
    /**
     * Рассылка всем Back-end разработчикам
     */
    async backMailing() {
        let allBack = await this.dataBaseService.getAllUsersByRole('backDeveloper');
        let message = await this.getDevMessage(false)
        allBack.forEach(async backer => {
            await this.bot.telegram.sendMessage(backer.telegramId, (message != null ? message : 'Сейчас задач нет'), { parse_mode: 'HTML' })
        });
    }
    /**
     * Получение сообщения для "Разработчик"
     * @param isFront сообщение для фронт?
     */
    async getDevMessage(isFront: boolean): Promise<string> {
        let msg = 'Задачи:\n\n'
        let taskes = isFront ? await this.getFrontCards() : await this.getBackCards();
        console.log(taskes)
        if (!taskes) {
            return 'Задач нет';
        }
        let num = 1
        taskes.forEach(element => {
            msg += (num + '. <a href="' + element.url + '"><b>' + element.name + '</b></a>\n' + element.desc + '\n')
            num++
        });
        return msg;
    }
}
