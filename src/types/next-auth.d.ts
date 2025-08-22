import "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      club_id?: string | null;
    };
    needsPassword?: boolean;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    requiresTwoFactor?: boolean;
  }
}

// Extend the JWT payload
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    club_id?: string | null;
    needsPassword?: boolean;
  }
}
