import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity()
export class Data {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;
    
    @Column()
    label: string;
}
