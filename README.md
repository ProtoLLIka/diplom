# Автоматизированная система классификации сообщений об ошибках с использованием нейронной сети
## Общее
### Назначение
Система нужна для 2х основных вещей: классификация задач в Trello и оповещение соотвествующих сотрудников о том, что есть актуальные задачи в Telegram.
Классификация происходит автоматически. Текст новой задачи парсится и предеается в нейронную сеть, которая на выходе отдает один из 2х тегов 'front-end' или 'back-end'
Если в столбце есть задачи, то система в определенное время отправит соответствующему пользователю сообщение с названием задачи и ссылкой на карточку в Trello.
Система предназначена для использования в след. сценарии: на рабочем месте каждый день назначается дежурный который "разгребает" задачи поступившие от менеджеров о багах и репортах.
### На чем сделано
Данная системя представляет из себя NodeJS web-сервер построенный на базе фреймворка NestJS. Система имеет интеграции с такими сервисами как мессенджер telegram (в роли бота) и таск-менеджер Trello (в роли улучшения для доски с задачами). Сама система - это обрабочик для работы с сервисами и отдельный сервер нейросети.
Основные модули системы написаны на TypeScript.
## Чуть подробнее про все
### Сервер для работы с сервисами 
Его основными задачами является:
1. Обработка запросов с Telegram-а. Весь "UI" - это чат с ботом. Взаимодействие с ним происходит с помощью спец. команд и встроенных в сообщения кнопки. 
2. Обработка запросов с Trello. Обратываются они через подписку на webhook на события создания карточки.
3. Автоматическая отправка сообщений о существующих актуальных задачах соответствующим пользователям. Например, если есть задача с тегом 'front-end', то разработчику-дежурнуму отправляется в начале рабочего дня сообщение: "Есть задачи: Название задачи 1 (<--- слово-ссылка на карточку)" 
4. Работа с БД. Работа происходит через механизмы библиотеки TypeORM. В БД вносятся новые пользователи, считываются нужные данные, ну и так далее...
### Сервер с запущенной моделью нейронной сети
Была скачана предобученная модель базы данных и после изменений кофига НС, она была переделана для классификации по необходимым классам (front-end и back-end). Тут практически нету рукописного кода.
