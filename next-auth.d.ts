import { Account } from '@prisma/client';
import NextAuth, { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  role: String;
  accounts: Account[];
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
    userId: string;
  }

  interface User {
    id: number;
    role: String;
    accounts: Account[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    role: String;
    accounts: Account[];
  }
}