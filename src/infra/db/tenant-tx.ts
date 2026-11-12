import { PrismaClient } from '@prisma/client';
import { TenantContext } from './tenant-context';

export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class TenantTx {
  /**
   * Runs an operation inside a PostgreSQL transaction scoped to the current tenant via RLS.
   * Sets `SET LOCAL app.tenant_id = :tenantId`.
   */
  static async run<T>(
    prisma: PrismaClient,
    fn: (tx: PrismaTransactionClient) => Promise<T>,
  ): Promise<T> {
    const tenantId = TenantContext.get()?.tenantId;
    const isPlatform = TenantContext.isPlatformOwner();

    return prisma.$transaction(async (tx) => {
      if (tenantId && !isPlatform) {
        // Enforce PostgreSQL RLS locally for this transaction
        await (tx as any).$executeRawUnsafe(
          `SET LOCAL app.tenant_id = '${tenantId.replace(/'/g, "''")}';`,
        );
      }
      return fn(tx as PrismaTransactionClient);
    });
  }
}

