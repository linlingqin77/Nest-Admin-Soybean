import { PrismaService } from 'src/prisma/prisma.service';

export type PrismaMock = jest.Mocked<PrismaService>;

type AnyFunction<TReturn = unknown> = (...args: unknown[]) => TReturn;

interface ModelMock {
  [key: string]: jest.Mock;
}

const createModelMock = (): ModelMock =>
  new Proxy<ModelMock>(
    {},
    {
      get(target, prop: string) {
        if (!Object.prototype.hasOwnProperty.call(target, prop)) {
          target[prop] = jest.fn();
        }
        return target[prop];
      },
    },
  );

export const createPrismaMock = (): PrismaMock => {
  const base: Record<string, unknown> = {
    $transaction: jest.fn<Promise<unknown>, [unknown]>(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        target[prop] = createModelMock();
      }
      return target[prop];
    },
  };

  const proxy = new Proxy(base, handler);

  (base.$transaction as jest.MockedFunction<AnyFunction<Promise<unknown>>>).mockImplementation(async (param) => {
    if (typeof param === 'function') {
      return param(proxy);
    }
    return param;
  });

  return proxy as unknown as PrismaMock;
};
