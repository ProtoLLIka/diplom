import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getActivate(): string {
    return 'System ON';
  }
}
