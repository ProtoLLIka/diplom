import { Injectable, FactoryProvider } from '@nestjs/common';
import { Role } from 'src/dto/role.dto';
import { UserRole } from 'src/dto/user_role.dto';
import { User } from 'src/dto/user.dto';
import { Data } from 'src/dto/neuralData.dto';
import { Task } from 'src/dto/task.dto';
import "reflect-metadata";
import { Repository } from "typeorm";
import { InjectRepository } from '@nestjs/typeorm';

export const dbEntities = [User, UserRole, Role, Task, Data];
export const dbConfig: FactoryProvider = {
    provide: 'DB_CONFIG',
    useFactory: () => {
        return {
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: '241234',
            database: 'telegramBot',
            entities: dbEntities,
            synchronize: true,
            logging: false
        };
    },
};

@Injectable()
export class DataBaseService {

    constructor(

        @InjectRepository(User)
        private user: Repository<User>,
        @InjectRepository(UserRole)
        private userRole: Repository<UserRole>,
        @InjectRepository(Role)
        private role: Repository<Role>,
        @InjectRepository(Task)
        private task: Repository<Task>,
        @InjectRepository(Data)
        private data: Repository<Data>

    ) {
    }
    /**
     * Добовляет нового пользователя в базу данных
     * @param model данные пользователя
     */
    async addUser(model: User) {
        let user = await this.user.save(model);
        return user;
    }
    /**
     * Получить всех пользователей
     */
    async getAllUsers() {
        return await this.user.find();
    }
    /**
     * Возвращает множество пользователей с определенной ролью
     * @param roleName Название роли для поиска
     */
    async getAllUsersByRole(roleName: string) {
        let roleId = await this.getRoleId(roleName)
        let allUserRolesId = await (await this.getAllUserRoles()).filter(async o => o.idRole == roleId)
        let allUsers = await (await this.getAllUsers()).filter(async o => allUserRolesId.some(e => e.idUser == o.id))
        return allUsers;
    }
    /**
     * Добовляет связь пользователь-роль
     * @param model данные пользователя и его ролей
     */
    async addUserRole(model: UserRole) {
        let userRole = await this.userRole.save(model);
        return userRole;
    }
    /**
     * Получение всех связей пользователь-роль
     */
    async getAllUserRoles() {
        return await this.userRole.find();
    }
    /**
     * Добавляет в базу данных новую задачу
     * @param model данные задачи
     */
    async addTask(model: Task) {
        let task = await this.task.save(model);
        return task;
    }
    /**
     * Получить все задачи
     */
    async getAllTaskes() {
        return await this.task.find();
    }
    /**
     * Получить все роли
     */
    async getAllRoles() {
        return await this.role.find();
    }
    /**
     * Получить id роли
     * @param roleName название роли для поиска
     */
    async getRoleId(roleName: string): Promise<number> {
        let role = await (await this.getAllRoles()).find(e => e.name == roleName)
        return role.id;
    }
    /**
     * Получить все тексты
     */
    async getAllNeuralData() {
        return await this.data.find();
    }
    /**
     * Добовляет текст в базу данных
     * @param model данные пользователя
     */
    async addData(text: string, label: string) {
        let data: Data;
        data.label = label;
        data.text = text
        return await this.user.save(data);
    }
}