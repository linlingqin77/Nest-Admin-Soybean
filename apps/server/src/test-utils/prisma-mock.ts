import { PrismaService } from 'src/platform/prisma';

export type PrismaMock = jest.Mocked<PrismaService>;

type AnyFunction = (...args: any[]) => any;

const createModelMock = () =>
  new Proxy(
    {},
    {
      get(target: Record<string, unknown>, prop: string) {
        if (!Object.prototype.hasOwnProperty.call(target, prop)) {
          // eslint-disable-next-line @typescript-eslint/ban-types
          (target as Record<string, unknown>)[prop] = jest.fn();
        }
        return (target as Record<string, unknown>)[prop];
      },
    },
  );

export const createPrismaMock = (): PrismaMock => {
  const base: Record<string, any> = {
    $transaction: jest.fn<Promise<any>, [any]>(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const handler: ProxyHandler<Record<string, any>> = {
    get(target, prop: string) {
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        (target as Record<string, any>)[prop] = createModelMock();
      }
      return (target as Record<string, any>)[prop];
    },
  };

  const proxy = new Proxy(base, handler);

  (base.$transaction as jest.MockedFunction<AnyFunction>).mockImplementation(async (param) => {
    if (typeof param === 'function') {
      return param(proxy);
    }
    return param;
  });

  return proxy as PrismaMock;
};
