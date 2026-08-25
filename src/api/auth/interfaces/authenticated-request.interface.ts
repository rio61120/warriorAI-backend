import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  user_name: string;
  name: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  authToken: string;
  sessionId: string;
}
