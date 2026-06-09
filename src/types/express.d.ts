// src/types/express.d.ts

declare global {
  namespace Express {
    interface User {
      id: string | number;
      email?: string;
      roles?: string[];
      permissions?: string[];
    }

    interface Request {
      user?: User;
    }
  }
}

export {};