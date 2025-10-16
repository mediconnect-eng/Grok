import { betterAuth } from "better-auth";
import { Pool } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : { rejectUnauthorized: false }, // Neon requires SSL even in development
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const socialProviders: Record<
  string,
  {
    clientId: string;
    clientSecret: string;
  }
> = {};

if (githubClientId && githubClientSecret) {
  socialProviders.github = {
    clientId: githubClientId,
    clientSecret: githubClientSecret,
  };
}

if (googleClientId && googleClientSecret) {
  socialProviders.google = {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  };
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  trustedOrigins: process.env.NODE_ENV === 'production' 
    ? ['https://healthhubinternational.com', 'https://www.healthhubinternational.com']
    : ['http://localhost:3000'],
  
  emailAndPassword: {
    enabled: true,
    // Require email verification (disabled for now, enable when SMTP configured)
    requireEmailVerification: false,
  },
  
  session: {
    // Session expires after 30 days of inactivity
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    
    // Update session activity every 1 hour
    updateAge: 60 * 60, // 1 hour in seconds
    
    // Cookie configuration
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  },
  
  // Advanced security options
  advanced: {
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === 'production',
    
    // Cookie domain for production
    cookieDomain: process.env.NODE_ENV === 'production' 
      ? '.healthhubinternational.com' 
      : undefined,
    
    // Cross-site request forgery protection
    crossSubDomainCookies: {
      enabled: true,
    },
    
    // Generate new session ID on login
    generateSessionToken: true,
  },
  
  socialProviders: Object.keys(socialProviders).length
    ? socialProviders
    : undefined,
});
