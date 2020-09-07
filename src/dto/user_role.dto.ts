import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity()
export class UserRole {

    @PrimaryColumn()
    idUser: number;

    @PrimaryColumn()
    idRole: number;
}
