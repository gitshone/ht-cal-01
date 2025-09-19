import { google } from 'googleapis';
import { BaseService } from '../../core/base.service';
import { googleOAuthRepository } from './google-oauth.repository';
import { NoGoogleTokensError } from '../../errors/http.errors';

export class GoogleOAuthService extends BaseService {
  private oauth2Client: any;

  constructor() {
    super();
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage'
    );
  }

  async exchangeCodeForTokens(userId: string, code: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid token response from Google');
      }

      // Save tokens to user
      await googleOAuthRepository.updateTokens(userId, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date || 0,
        scope: tokens.scope || '',
      });

      this.logInfo('Google OAuth tokens exchanged successfully', { userId });
    } catch (error) {
      this.handleServiceError(error as Error, 'exchangeCodeForTokens', {
        userId,
      });
    }
  }

  async getOAuth2Client(userId: string): Promise<any> {
    try {
      const user = await googleOAuthRepository.getUserTokens(userId);

      if (!user?.googleOauthTokens) {
        throw new NoGoogleTokensError();
      }

      const tokens = user.googleOauthTokens as {
        access_token: string;
        refresh_token: string;
        scope: string;
        token_type: string;
        expiry_date: number;
      };

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      oauth2Client.on('tokens', async newTokens => {
        if (newTokens.refresh_token) {
          await googleOAuthRepository.updateTokens(userId, {
            access_token: newTokens.access_token || tokens.access_token,
            refresh_token: newTokens.refresh_token,
            expiry_date: newTokens.expiry_date || tokens.expiry_date,
            scope: newTokens.scope || tokens.scope,
          });
        }
      });

      return oauth2Client;
    } catch (error) {
      this.handleServiceError(error as Error, 'getOAuth2Client', { userId });
    }
  }

  async refreshAccessToken(
    userId: string,
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update tokens in database
      await googleOAuthRepository.updateTokens(userId, {
        access_token: credentials.access_token,
        refresh_token: refreshToken,
        expiry_date: credentials.expiry_date || 0,
        scope: credentials.scope || '',
      });

      this.logInfo('Google OAuth access token refreshed', { userId });

      return { accessToken: credentials.access_token };
    } catch (error) {
      this.handleServiceError(error as Error, 'refreshAccessToken', { userId });
    }
  }

  async revokeTokens(userId: string, token: string): Promise<void> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      await oauth2Client.revokeToken(token);

      // Clear tokens from database
      await googleOAuthRepository.revokeTokens(userId);

      this.logInfo('Google OAuth tokens revoked', { userId });
    } catch (error) {
      this.handleServiceError(error as Error, 'revokeTokens', { userId });
    }
  }
}

export const googleOAuthService = new GoogleOAuthService();
