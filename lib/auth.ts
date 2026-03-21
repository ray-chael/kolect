import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import React from "react";
import { WelcomeEmail } from "@/emails/welcome";
import { SignInAlertEmail } from "@/emails/sign-in-alert";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://www.kolekt.com.ng",
    "https://kolekt.com.ng",
    "https://ades-kolect.vercel.app",
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh session every 24 hours
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const name = user.name ?? (user.email as string).split("@")[0];
          sendEmail({
            to: user.email as string,
            subject: "Welcome to Ade's Kolekt 🛍️",
            react: React.createElement(WelcomeEmail, { customerName: name }),
          }).catch(console.error);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Only send sign-in alert for returning users (not the initial
          // session created immediately after registration — user.createdAt
          // will be within a few seconds of the session).
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { name: true, email: true, createdAt: true },
          });
          if (!user?.email) return;

          const ageMs = Date.now() - new Date(user.createdAt).getTime();
          if (ageMs < 120_000) return; // skip if account is < 2 min old

          const name = user.name ?? user.email.split("@")[0];
          const signedInAt = new Intl.DateTimeFormat("en-NG", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date());

          sendEmail({
            to: user.email,
            subject: "New sign-in to your Ade's Kolekt account",
            react: React.createElement(SignInAlertEmail, {
              customerName: name,
              signedInAt,
            }),
          }).catch(console.error);
        },
      },
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "EMERALD",
      },
      hasAcceptedTerms: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
