import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) return null;

        // In a real app, use bcrypt to compare passwords
        // For now, since we haven't installed bcrypt yet, we'll do a simple check
        // but we SHOULD install bcrypt
        if (user.password !== credentials.password) return null;

        return user;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    newUser: '/profile/create',
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      if (trigger === "update" && session?.username) {
        token.username = session.username;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log('SignIn Event:', JSON.stringify(message, null, 2));
    },
    async createUser(message) {
      console.log('CreateUser Event:', JSON.stringify(message, null, 2));
    },
    async linkAccount(message) {
      console.log('LinkAccount Event:', JSON.stringify(message, null, 2));
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
