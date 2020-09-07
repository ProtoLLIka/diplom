import * as trello from 'node-fetch'


const fetch = require('node-fetch');

fetch('https://api.trello.com/1/webhooks/?callbackURL=https://trello-slack-bot.herokuapp.com/trello&idModel=5e8afc14400ece502469d077&key=9b592061838cab33984abeceaf366c8e&token=62833802cf82d37c39eede12970579d24413120c6244878e565e28322e478717', {
  method: 'POST',
  headers: {
    'Accept': 'application/json'
  }
})
  .then(response => {
    console.log(
      `Response: ${response.status} ${response.statusText}`
    );
    return response.text();
  })
  .then(text => console.log(text))
  .catch(err => console.error(err));