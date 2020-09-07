import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./dto/user.dto";
import e = require('express');
import { Role } from './dto/role.dto';
import { UserRole } from './dto/user_role.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen('3000');
  
  
}

bootstrap();

