import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { MetricsController } from './metrics.controller';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

describe('MetricsController', () => {
  let controller: MetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('index', () => {
    it('should return metrics data', async () => {
      const mockResponse = {
        setHeader: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as any;

      // Mock the parent class method to avoid actual Prometheus calls
      jest.spyOn(PrometheusController.prototype, 'index').mockResolvedValue(undefined);

      await controller.index(mockResponse);

      expect(PrometheusController.prototype.index).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle metrics request', async () => {
      const mockResponse = {
        setHeader: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as any;

      jest.spyOn(PrometheusController.prototype, 'index').mockResolvedValue(undefined);

      await expect(controller.index(mockResponse)).resolves.not.toThrow();
    });
  });
});
