import { Test, TestingModule } from '@nestjs/testing';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { Observable } from 'rxjs';

describe('SseController', () => {
  let controller: SseController;
  let sseService: jest.Mocked<SseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        {
          provide: SseService,
          useValue: {
            addClient: jest.fn(),
            removeClient: jest.fn(),
            sendToUser: jest.fn(),
            broadcast: jest.fn(),
            getClientCount: jest.fn(),
            getUserConnectionCount: jest.fn(),
          },
        },
      
      ],
      }).compile();

    controller = module.get<SseController>(SseController);
    sseService = module.get(SseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sse', () => {
    it('should establish SSE connection with valid token', (done) => {
      const authorization = 'Bearer test-token';
      const clientid = 'test-client';
      const mockRequest = {
        on: jest.fn(),
      } as any;

      const mockObservable = new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'test message' } as MessageEvent);
        subscriber.complete();
      });

      sseService.addClient.mockReturnValue(mockObservable);

      const result = controller.sse(authorization, clientid, mockRequest);

      expect(result).toBeDefined();
      expect(sseService.addClient).toHaveBeenCalled();

      result.subscribe({
        next: (event) => {
          expect(event.data).toBeDefined();
        },
        complete: () => {
          done();
        },
      });
    });

    it('should return unauthorized when no token provided', (done) => {
      const authorization = '';
      const clientid = 'test-client';
      const mockRequest = {
        on: jest.fn(),
      } as any;

      const result = controller.sse(authorization, clientid, mockRequest);

      result.subscribe({
        next: (event) => {
          expect(event.data).toBe('Unauthorized');
        },
        complete: () => {
          done();
        },
      });

      expect(sseService.addClient).not.toHaveBeenCalled();
    });

    it('should handle connection close event', () => {
      const authorization = 'Bearer test-token';
      const clientid = 'test-client';
      let closeHandler: () => void;

      const mockRequest = {
        on: jest.fn((event, handler) => {
          if (event === 'close') {
            closeHandler = handler;
          }
        }),
      } as any;

      const mockObservable = new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'test' } as MessageEvent);
      });

      sseService.addClient.mockReturnValue(mockObservable);

      controller.sse(authorization, clientid, mockRequest);

      expect(mockRequest.on).toHaveBeenCalledWith('close', expect.any(Function));

      // Simulate connection close
      if (closeHandler) {
        closeHandler();
        expect(sseService.removeClient).toHaveBeenCalled();
      }
    });

    it('should generate unique client ID when clientid not provided', () => {
      const authorization = 'Bearer test-token';
      const clientid = '';
      const mockRequest = {
        on: jest.fn(),
      } as any;

      const mockObservable = new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'test' } as MessageEvent);
      });

      sseService.addClient.mockReturnValue(mockObservable);

      controller.sse(authorization, clientid, mockRequest);

      expect(sseService.addClient).toHaveBeenCalled();
      const callArgs = sseService.addClient.mock.calls[0];
      expect(callArgs[0]).toContain('unknown_');
    });
  });

  describe('closeSse', () => {
    it('should return success message', () => {
      const result = controller.closeSse();

      expect(result.code).toBe(200);
      expect(result.msg).toContain('SSE连接已关闭');
    });
  });

  describe('sendMessage', () => {
    it('should send message to specific user', () => {
      const userId = 1;
      const message = 'Test message';

      const result = controller.sendMessage(userId, message);

      expect(result.code).toBe(200);
      expect(result.msg).toContain('消息发送成功');
      expect(sseService.sendToUser).toHaveBeenCalledWith(userId, message);
    });

    it('should handle sending to multiple users', () => {
      controller.sendMessage(1, 'Message 1');
      controller.sendMessage(2, 'Message 2');

      expect(sseService.sendToUser).toHaveBeenCalledTimes(2);
      expect(sseService.sendToUser).toHaveBeenCalledWith(1, 'Message 1');
      expect(sseService.sendToUser).toHaveBeenCalledWith(2, 'Message 2');
    });
  });

  describe('broadcast', () => {
    it('should broadcast message to all users', () => {
      const message = 'Broadcast message';

      const result = controller.broadcast(message);

      expect(result.code).toBe(200);
      expect(result.msg).toContain('广播成功');
      expect(sseService.broadcast).toHaveBeenCalledWith(message);
    });

    it('should handle empty message', () => {
      const message = '';

      const result = controller.broadcast(message);

      expect(result.code).toBe(200);
      expect(sseService.broadcast).toHaveBeenCalledWith('');
    });
  });

  describe('getCount', () => {
    it('should return client count', () => {
      sseService.getClientCount.mockReturnValue(5);

      const result = controller.getCount();

      expect(result.code).toBe(200);
      expect(result.data.count).toBe(5);
      expect(sseService.getClientCount).toHaveBeenCalled();
    });

    it('should return 0 when no clients connected', () => {
      sseService.getClientCount.mockReturnValue(0);

      const result = controller.getCount();

      expect(result.code).toBe(200);
      expect(result.data.count).toBe(0);
    });
  });
});
