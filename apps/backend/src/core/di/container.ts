export type ProviderToken =
  | string
  | symbol
  | (new (...args: unknown[]) => unknown);
export type ProviderValue = unknown;
export type ProviderDeps = ProviderToken[];

export interface ProviderConfig {
  deps?: ProviderDeps;
  singleton?: boolean;
}

export interface Provider {
  token: ProviderToken;
  value?: ProviderValue;
  factory?: () => unknown;
  deps?: ProviderDeps;
  singleton: boolean;
  instance?: unknown;
}

export class DIContainer {
  private providers = new Map<ProviderToken, Provider>();
  private instances = new Map<ProviderToken, unknown>();

  register(
    token: ProviderToken,
    provider: unknown | ProviderConfig,
    config?: ProviderConfig
  ): this {
    let providerConfig: Provider;

    if (typeof provider === 'function') {
      // Class provider
      providerConfig = {
        token,
        factory: () =>
          this.instantiateClass(
            provider as new (...args: unknown[]) => unknown,
            config?.deps
          ),
        deps: config?.deps,
        singleton: config?.singleton !== false, // Default to singleton
      };
    } else if (typeof provider === 'object' && provider !== null) {
      // Value provider
      providerConfig = {
        token,
        value: provider,
        singleton: config?.singleton !== false,
      };
    } else {
      throw new Error(`Invalid provider type for token: ${String(token)}`);
    }

    this.providers.set(token, providerConfig);
    return this;
  }

  registerFactory(
    token: ProviderToken,
    factory: () => unknown,
    config?: ProviderConfig
  ): this {
    const providerConfig: Provider = {
      token,
      factory,
      deps: config?.deps,
      singleton: config?.singleton !== false,
    };

    this.providers.set(token, providerConfig);
    return this;
  }

  resolve<T = any>(token: ProviderToken): T {
    const provider = this.providers.get(token);

    if (!provider) {
      throw new Error(`No provider found for token: ${String(token)}`);
    }

    // Return singleton instance if exists
    if (provider.singleton && this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Create new instance
    let instance: unknown;

    if (provider.value !== undefined) {
      instance = provider.value;
    } else if (provider.factory) {
      instance = provider.factory();
    } else {
      throw new Error(
        `Invalid provider configuration for token: ${String(token)}`
      );
    }

    // Store singleton instance
    if (provider.singleton) {
      this.instances.set(token, instance);
    }

    return instance as T;
  }

  has(token: ProviderToken): boolean {
    return this.providers.has(token);
  }

  clear(): void {
    this.providers.clear();
    this.instances.clear();
  }

  private instantiateClass(
    ClassConstructor: new (...args: unknown[]) => unknown,
    deps?: ProviderDeps
  ): unknown {
    if (deps) {
      const resolvedDeps = deps.map(dep => this.resolve(dep));
      return Reflect.construct(ClassConstructor, resolvedDeps);
    } else {
      const paramTypes = this.getConstructorParamTypes(ClassConstructor);
      if (paramTypes.length > 0) {
        const resolvedDeps = paramTypes.map(dep => this.resolve(dep));
        return Reflect.construct(ClassConstructor, resolvedDeps);
      } else {
        return Reflect.construct(ClassConstructor, []);
      }
    }
  }

  private getConstructorParamTypes(
    ClassConstructor: new (...args: unknown[]) => unknown
  ): ProviderToken[] {
    const constructorString = ClassConstructor.toString();
    const paramMatch = constructorString.match(/constructor\s*\(([^)]*)\)/);

    if (!paramMatch || !paramMatch[1].trim()) {
      return [];
    }

    return [];
  }
}

export const container = new DIContainer();
export const registerProvider = (
  token: ProviderToken,
  provider: unknown,
  config?: ProviderConfig
) => {
  return container.register(token, provider, config);
};

export const resolveProvider = <T = unknown>(token: ProviderToken): T => {
  return container.resolve<T>(token);
};

export const hasProvider = (token: ProviderToken): boolean => {
  return container.has(token);
};
