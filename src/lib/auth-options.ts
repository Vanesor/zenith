import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { Database } from "@/lib/database-consolidated";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          oauthProvider: "google",
          oauthId: profile.sub,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          oauthProvider: "github",
          oauthId: profile.id.toString(),
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { email, password, totpCode } = credentials;

        try {
          // Check if user exists
          const userResult = await Database.query(
            `SELECT id, email, name, password_hash, role, avatar, totp_enabled, totp_secret 
             FROM users 
             WHERE email = $1`,
            [email]
          );

          const user = userResult.rows[0];
          if (!user) return null;

          // Verify password
          const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash
          );

          if (!isValidPassword) return null;

          // Check if 2FA is enabled
          if (user.totp_enabled && user.totp_secret) {
            // Import dynamically to avoid server-side issues
            const { TwoFactorAuthService } = await import("@/lib/TwoFactorAuthService");

            // If 2FA is enabled but no code provided, return partial auth that requires 2FA
            if (!totpCode) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                requiresTwoFactor: true,
              };
            }

            // Verify TOTP code
            const isValidTOTP = TwoFactorAuthService.verifyToken(
              totpCode,
              user.totp_secret
            );

            if (!isValidTOTP) return null;
          }

          // Return authenticated user
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        let dbUser;

        // Check if this is an OAuth login
        if (account.provider === "google" || account.provider === "github") {
          try {
            // Try to find user by OAuth ID or email
            const existingUserByOAuth = await Database.query(
              `SELECT * FROM users 
               WHERE oauth_provider = $1 AND oauth_id = $2`,
              [account.provider, account.providerAccountId]
            );

            // If user exists, use it
            if (existingUserByOAuth.rows.length > 0) {
              dbUser = existingUserByOAuth.rows[0];
            } else {
              // Try to find user by email
              const existingUserByEmail = await Database.query(
                `SELECT * FROM users WHERE email = $1`,
                [user.email]
              );

              if (existingUserByEmail.rows.length > 0) {
                // Update existing user with OAuth details
                await Database.query(
                  `UPDATE users 
                   SET 
                    oauth_provider = $1, 
                    oauth_id = $2,
                    oauth_data = $3,
                    email_verified = true
                   WHERE email = $4
                   RETURNING *`,
                  [
                    account.provider,
                    account.providerAccountId,
                    JSON.stringify(account),
                    user.email,
                  ]
                );
                
                dbUser = existingUserByEmail.rows[0];
              } else {
                // Create new user
                const result = await Database.query(
                  `INSERT INTO users 
                   (id, email, name, avatar, role, oauth_provider, oauth_id, oauth_data, email_verified, has_password) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                   RETURNING *`,
                  [
                    uuidv4(),
                    user.email,
                    user.name,
                    user.image,
                    "student", // Default role
                    account.provider,
                    account.providerAccountId,
                    JSON.stringify(account),
                    true, // Email already verified through OAuth
                    false, // User needs to set a password
                  ]
                );

                dbUser = result.rows[0];
              }
            }

            // Check if user needs to set a password
            if (dbUser && !dbUser.has_password) {
              token.needsPassword = true;
            }
          } catch (error) {
            console.error("Error handling OAuth user:", error);
          }
        }

        // Merge any database user fields with the token
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.club_id = dbUser.club_id;
        } else {
          // Fallback to passed user (from credentials provider)
          token.id = user.id;
          token.role = user.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add custom session fields
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.club_id = token.club_id as string;
        
        if (token.needsPassword) {
          session.needsPassword = true;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding", // Redirect new OAuth users to onboarding
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
