import { Injectable } from '@nestjs/common';
import { GoogleCalendarProvider } from './google-calendar.provider';

export type ProviderType = 'google' | 'microsoft' | 'zoom';

export interface BaseProvider {
  getConfig(): {
    type: string;
    name: string;
    scopes: string[];
    authUrl: Promise<string>;
  };
}

@Injectable()
export class ProviderRegistry {
  private providers = new Map<ProviderType, BaseProvider>();

  constructor(private googleCalendarProvider: GoogleCalendarProvider) {
    this.register('google', this.googleCalendarProvider);
  }

  register(type: ProviderType, provider: BaseProvider): void {
    this.providers.set(type, provider);
  }

  getProvider(type: ProviderType): BaseProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not found`);
    }
    return provider;
  }

  getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderTypes(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  hasProvider(type: ProviderType): boolean {
    return this.providers.has(type);
  }

  getProviderConfig(type: ProviderType) {
    const provider = this.getProvider(type);
    return provider.getConfig();
  }

  getAllProviderConfigs() {
    return this.getAllProviders().map(provider => provider.getConfig());
  }
}
