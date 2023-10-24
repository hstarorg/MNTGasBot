import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  sayHi() {
    return { hi: 'Welcome to MNTGasBot!' };
  }
}
