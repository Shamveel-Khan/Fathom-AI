export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarColor?: string;
  avatarUrl?: string;
}

// Full account record used internally for authentication
// passwordHash is null for OAuth-only accounts
export interface UserAccount extends User {
  passwordHash: string | null;
}

// Input type for creating a new user via email/password signup
export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export interface Session {
  userId: string;
  email: string;
}
