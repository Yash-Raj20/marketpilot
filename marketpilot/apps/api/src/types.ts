import type { Request } from 'express';

export type UserRole = 'USER' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
};

export type AuthRequest = Request & { user?: AuthUser };
