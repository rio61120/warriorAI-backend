export interface AuthUserResponse {
  id: string;
  user_name: string;
  name: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  expiresAt: string;
  user: AuthUserResponse;
}
