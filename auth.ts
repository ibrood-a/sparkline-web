import NextAuth from 'next-auth';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';
import authConfig from '@/auth.config';
import { Account } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/login',
    error: '/error',
  },
  events: {
    async linkAccount({ user }) {
      const userId = Number(user.id);
      await db.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') return true;

      const existingUser = await getUserById(Number(user.id));
      if (!existingUser?.emailVerified) return false;

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as String;
        session.user.accounts = token.accounts as Account[];
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const userWithAccounts = await db.user.findUnique({
          where: { id: Number(user.id) },
          include: { accounts: true },
        });

        token.sub = user.id;
        token.role = userWithAccounts?.role;
        token.accounts = userWithAccounts?.accounts || ["GOOGLE"];
      }

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});
