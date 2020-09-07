import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity()
export class Task {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
    @Column()
    description: string;

    @Column()
    link: string;

    @Column()
    neuralLabel: string;

    @Column({nullable: true})
    trueLabel?: string;
}
