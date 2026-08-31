/**
 * @file Common Services Unit Tests
 * @description Migrated from src/modules/common.services.spec.ts
 */
import { AxiosService } from '@/modules/axios/axios.service';
import { RedisService } from '@/platform/redis/redis.service';
import type { HttpService } from '@nestjs/axios';

const createRedisClientMock = () => ({
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue(['k1', 'k2']),
  info: jest.fn().mockResolvedValue('cmdstat_get:calls=4,usec=10\r\n'),
  dbsize: jest.fn().mockResolvedValue(2),
  mget: jest.fn().mockResolvedValue(['"a"', '"b"']),
  hmset: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
});

describe('AxiosService', () => {
  let service: AxiosService;
  const axiosRef = jest.fn();
  const httpService = { axiosRef } as unknown as HttpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AxiosService(httpService);
  });

  it('should return ip address when external api succeeds', async () => {
    axiosRef.mockResolvedValue({ data: { addr: '北京' } });
    const addr = await service.getIpAddress('127.0.0.1');
    expect(addr).toBe('北京');
    expect(axiosRef).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1'), expect.any(Object));
  });

  it('should fallback to 未知 when external api fails', async () => {
    axiosRef.mockRejectedValue(new Error('network error'));
    const addr = await service.getIpAddress('127.0.0.1');
    expect(addr).toBe('未知');
  });
});

describe('RedisService', () => {
  const client = createRedisClientMock();
  const service = new RedisService(client as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should stringify payload when setting value without ttl', async () => {
    await service.set('token', { value: 1 });
    expect(client.set).toHaveBeenCalledWith('token', JSON.stringify({ value: 1 }));
  });

  it('should support ttl when setting value', async () => {
    await service.set('token', { value: 1 }, 1000);
    expect(client.set).toHaveBeenCalledWith('token', JSON.stringify({ value: 1 }), 'PX', 1000);
  });

  it('should parse json payload when getting value', async () => {
    client.get.mockResolvedValue(JSON.stringify({ bar: 2 }));
    const value = await service.get('token');
    expect(value).toEqual({ bar: 2 });
  });

  it('should reset database by removing every key', async () => {
    client.keys.mockResolvedValue(['a', 'b']);
    await service.reset();
    expect(client.del).toHaveBeenCalledWith(['a', 'b']);
  });

  it('should parse command stats', async () => {
    client.info.mockResolvedValue('cmdstat_get:calls=4,usec=10\r\n');
    const stats = await service.commandStats();
    expect(stats).toEqual([{ name: 'get', value: 4 }]);
  });
});
