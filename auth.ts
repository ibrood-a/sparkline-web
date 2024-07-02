import NextAuth from 'next-auth';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';
import authConfig from '@/auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { Account } from '@prisma/client'

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
        session.user.role = token.role as string;
        session.user.accounts = token.accounts as Account[];
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch accounts directly from the account table where userId matches user.id
        const accounts = await db.account.findMany({
          where: { userId: Number(user.id) },
        });

        // Transform accounts into an object where each provider is a key and the value is true
        const accountProviders = accounts.reduce<Record<string, boolean>>((result, account) => {
          result[account.provider.toUpperCase()] = true;
          return result;
        }, {});

        console.table(accounts);

        token.sub = user.id;
        token.role = user.role;
        token.accounts = accountProviders;
      }

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});
