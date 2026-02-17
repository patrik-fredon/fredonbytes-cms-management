export interface AuthService {
  signIn(input: {
    email: string;
    password: string;
  }): Promise<{
    userId: string;
  }>;
  signOut(): Promise<void>;
}
