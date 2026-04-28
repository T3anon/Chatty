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
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        }
      },
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

        if (!user || !user.password) {
          console.log('User not found or has no password:', credentials.email);
          return null;
        }

        // In a real app, use bcrypt to compare passwords
        if (user.password !== credentials.password) {
          console.log('Invalid password for user:', credentials.email);
          return null;
        }

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
      if (trigger === "update" && session) {
        if (session.username) token.username = session.username;
        if (session.name) token.name = session.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        session.user.name = token.name as string | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account, profile, email, credentials }) {
      if (!process.env.NEXTAUTH_SECRET) {
        console.error('CRITICAL: NEXTAUTH_SECRET is not defined!');
      }
      return true;
    },
  },
  events: {},
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
