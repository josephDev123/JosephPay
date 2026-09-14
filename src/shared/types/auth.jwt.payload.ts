export interface JwtPayload {
  sub: string;
  email: string;
  typ: 'access' | 'refresh';
}
