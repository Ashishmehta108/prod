export interface LoginProps {
  onLoginSuccess: (
    user: { id: string; username: string; email: string; role: string },
    token: string
  ) => void;
}
