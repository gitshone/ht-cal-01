// User related DTOs
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

// Authentication DTOs
export interface FirebaseAuthDto {
  firebaseToken: string;
}

export interface AuthResponseDto {
  user: User;
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

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Firebase User Info (from Firebase token)
export interface FirebaseUserInfo {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}
