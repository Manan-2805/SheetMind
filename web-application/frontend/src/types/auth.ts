export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  created_at: string;
  last_login_at: string | null;
}
