declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            access_type: string;
            ux_mode: string;
            callback: (response: { code: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

export class GoogleOAuthService {
  private clientId: string;
  private isInitialized = false;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!this.clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is required');
    }
  }

  private async waitForGoogleAPI(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const checkGoogle = () => {
        if (window.google?.accounts?.oauth2) {
          this.isInitialized = true;
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google OAuth2 API failed to load'));
      }, 10000);

      checkGoogle();
    });
  }

  async requestCalendarAccess(): Promise<string> {
    await this.waitForGoogleAPI();

    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          ux_mode: 'popup',
          callback: async response => {
            try {
              if (response.code) {
                resolve(response.code);
              } else {
                reject(new Error('No authorization code received'));
              }
            } catch (error) {
              reject(error);
            }
          },
        });

        client.requestCode();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const googleOAuthService = new GoogleOAuthService();
