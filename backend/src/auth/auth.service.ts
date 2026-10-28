import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, _password: string) {
    // Placeholder — JWT implementation comes in a later day
    return { email, token: 'placeholder' };
  }
}
