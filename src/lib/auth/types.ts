export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarColor?: string;
}

// Full account record stored in users.json (includes password & file pointer)
export interface UserAccount extends User {
  password: string;
  dataFile: string;
}

export interface Session {
  userId: string;
}
