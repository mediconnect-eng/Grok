'use client';

import { createAuthClient } from "better-auth/react";

const resolveBaseUrl = (): string | undefined => {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL;
};

export const authClient = createAuthClient({
  baseURL: resolveBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
