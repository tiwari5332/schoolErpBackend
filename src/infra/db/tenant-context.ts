import { AsyncLocalStorage } from 'async_hooks';

export interface TenantSessionContext {
  tenantId: string;
  userId?: string;
  roleKey?: string;
  permissions?: string[];
  sessionId?: string;
  isPlatformOwner?: boolean;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantSessionContext>();

export class TenantContext {
  static run<R>(context: TenantSessionContext, fn: () => R): R {
    return asyncLocalStorage.run(context, fn);
  }

  static get(): TenantSessionContext | undefined {
    return asyncLocalStorage.getStore();
  }

  static getTenantId(): string {
    const store = asyncLocalStorage.getStore();
    if (!store?.tenantId) {
      throw new Error('Tenant context is missing in active AsyncLocalStorage.');
    }
    return store.tenantId;
  }

  static getUserId(): string | undefined {
    return asyncLocalStorage.getStore()?.userId;
  }

  static getRoleKey(): string | undefined {
    return asyncLocalStorage.getStore()?.roleKey;
  }

  static getPermissions(): string[] {
    return asyncLocalStorage.getStore()?.permissions || [];
  }

  static getSessionId(): string | undefined {
    return asyncLocalStorage.getStore()?.sessionId;
  }

  static isPlatformOwner(): boolean {
    return asyncLocalStorage.getStore()?.isPlatformOwner === true;
  }
}

