import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TrelloList {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string

    @Column()
    trelloId: string
}