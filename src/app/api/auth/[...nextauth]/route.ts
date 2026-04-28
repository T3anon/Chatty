import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
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
    async redirect({ url, baseUrl }) {
      console.log('Redirect Callback:', { url, baseUrl });
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn Callback:', { userEmail: user?.email, provider: account?.provider });
      if (!process.env.NEXTAUTH_SECRET) {
        console.error('CRITICAL: NEXTAUTH_SECRET is not defined!');
      }
      if (!process.env.NEXTAUTH_URL) {
        console.warn('WARNING: NEXTAUTH_URL is not defined! Current origin will be used.');
      }
      return true;
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
