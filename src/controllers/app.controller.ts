import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.sayHi();
  }
}
