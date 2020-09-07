
import * as data from "src/db/learning"
enum Label {
  Front = 1,
  Back = 2
}

export function outData() {
  let cards = data.dataNN.cards;
  let cardsFront: Data[] = [];
  let cardsBack: Data[] = [];

  cards.filter(e => e.labels.length > 0).forEach(element => {
    switch (element.labels[0].name) {
      case "Фронтенд": {
        cardsFront.push(new Data(element.name + " " + element.desc, 1));
      }
      case "Бекенд": {
        cardsBack.push(new Data(element.name + " " + element.desc, 2));
      }
      default: {
        break;
      }
    }
  });

  cardsFront.forEach(element => {
    element.desc = element.desc.replace(/'\d0\d\d-\d\d-\d\d \d\d:\d\d:\d\d'/g, " ");
    element.desc = element.desc.replace(/(?:\r\n|\r|\n)/g, " ");
    element.desc = element.desc.replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, " ");
    element.desc = element.desc.replace(/[-a-zA-Z0-9@:%._&\/+~#=]/g, "");
  });
}


class Data {
  constructor(
    public desc: string,
    public label: Label,
  ) { }
}
