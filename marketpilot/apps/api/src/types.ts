import type { Request } from 'express';
export type AuthRequest = Request & { user?: { id: string; email: string } };
