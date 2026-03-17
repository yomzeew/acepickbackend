import { Request } from 'express';
import { Socket } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      admin?: any;
      user?: any;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    user?: any;
  }
}

export {};
