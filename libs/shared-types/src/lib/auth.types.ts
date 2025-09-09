// Authentication DTOs
export interface FirebaseAuthDto {
  firebaseToken: string;
}

export interface AuthResponseDto {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AccessTokenDto {
  accessToken: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Firebase User Info (from Firebase token)
export interface FirebaseUserInfo {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}
