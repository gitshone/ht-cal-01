import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { NoGoogleTokensError } from '../errors/http.errors';

export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
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
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleOauthTokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            scope: tokens.scope,
          },
        },
      });
    } catch (error) {
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  async getOAuth2Client(userId: string): Promise<OAuth2Client> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleOauthTokens: true },
    });

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
        await prisma.user.update({
          where: { id: userId },
          data: {
            googleOauthTokens: {
              access_token: newTokens.access_token || tokens.access_token,
              refresh_token: newTokens.refresh_token,
              expiry_date: newTokens.expiry_date || tokens.expiry_date,
              scope: newTokens.scope || tokens.scope,
            },
          },
        });
      }
    });

    return oauth2Client;
  }
}

export const googleOAuthService = new GoogleOAuthService();
