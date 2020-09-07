import { Injectable } from "@nestjs/common";
import * as file from 'fs'
import { DataBaseService } from "src/db/dataBaseService";
import { testDataSet } from "./TestDataSet";
const axios = require('axios').default;

@Injectable()
export class NeuralNetwortService {
    public constructor(
        private dataBaseService: DataBaseService
    ) { }
    public neuralNetAccuracy: number;
    testFilePath = './src/neural_network/dataSet/valid.csv'
    getFileData(): string {
        file.readFile(this.testFilePath, 'utf8', function (error, data) {
            if (error) throw error
            console.log(data)
            return data;
        })
        return null;
    }
    addNewRaw(data: string, label: string) {
        file.readFile('./src/neural_network/dataSet/valid.csv', 'utf8', function (error, dataFile) {
            if (error) throw error 
            console.log(dataFile) // выводим считанные данные
            data.replace(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/, "")
            data.replace(/[^а-яёА-ЯЁ1-90a-zA-Z ]/, "")
            file.writeFile('./src/neural_network/dataSet/valid.csv', data + ',' + label, function (error) {
                if (error) throw error 
                // this.dataBaseService.addData(data, label)
                console.log('Асинхронная запись файла завершена. Содержимое файла:')
                let textFile = file.readFileSync('./src/neural_network/dataSet/valid.csv', 'utf8')
                console.log(textFile) // выводим считанные данные
            })
        })
    }

    async getNeuralNetAccuracy(): Promise<number> {
        let accuracy = 0;
        await testDataSet.forEach(async el => {
        });
        for (let index = 0; index < testDataSet.length; index++) {
            const el = testDataSet[index];
            let response = await axios.post('http://localhost:5000/model', { "x": [el.text] })
            if (response.data[0][0][0] && response.data[0][0][0] == el.label) {
                accuracy++;
            }
        }
        
        return accuracy / testDataSet.length;
    }
    async retrainModel(){
        
        this.neuralNetAccuracy = await this.getNeuralNetAccuracy();
    }
    getCountBackTaskes() {

    }
    getCountFrontTaskes() {

    }


}

