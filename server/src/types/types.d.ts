import 'express-session';
import Role from '../enums/user.enum';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: 'admin' | 'student' | 'guest' | 'instructor';
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
    }

    interface Request {
      user?: User;
    }
  }
}

import { Profile } from 'passport-github2';
