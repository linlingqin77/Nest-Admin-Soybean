import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosService } from './axios.service';
import { AxiosResponse } from 'axios';

describe('AxiosService', () => {
  let service: AxiosService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AxiosService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AxiosService>(AxiosService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getIpAddress', () => {
    it('should return IP address information on successful request', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          addr: '广东省深圳市 电信',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      (httpService.axiosRef as unknown as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getIpAddress('183.14.132.117');

      expect(result).toBe('广东省深圳市 电信');
      expect(httpService.axiosRef).toHaveBeenCalledWith(
        expect.stringContaining('ip=183.14.132.117'),
        expect.objectContaining({
          responseType: 'arraybuffer',
          timeout: 3000,
        }),
      );
    });

    it('should return "未知" when request fails', async () => {
      (httpService.axiosRef as unknown as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.getIpAddress('192.168.1.1');

      expect(result).toBe('未知');
    });

    it('should return "未知" when request times out', async () => {
      (httpService.axiosRef as unknown as jest.Mock).mockRejectedValue(new Error('timeout of 3000ms exceeded'));

      const result = await service.getIpAddress('8.8.8.8');

      expect(result).toBe('未知');
    });

    it('should handle invalid IP addresses gracefully', async () => {
      (httpService.axiosRef as unknown as jest.Mock).mockRejectedValue(new Error('Invalid IP'));

      const result = await service.getIpAddress('invalid-ip');

      expect(result).toBe('未知');
    });

    it('should handle empty response data', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      (httpService.axiosRef as unknown as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getIpAddress('127.0.0.1');

      expect(result).toBeUndefined();
    });
  });
});
