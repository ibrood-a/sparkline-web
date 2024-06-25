import { UserRole, Account } from '@prisma/client';
import NextAuth, { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  role: UserRole;
  accounts: Account[];
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
    userId: string;
  }

  interface User {
    id: number;
    role: UserRole;
    accounts: Account[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    role: UserRole;
    accounts: Account[];
  }
}