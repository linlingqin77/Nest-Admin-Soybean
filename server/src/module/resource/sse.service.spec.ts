import { Test, TestingModule } from '@nestjs/testing';
import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SseService],
    }).compile();

    service = module.get<SseService>(SseService);
  });

  afterEach(() => {
    // Clean up all clients after each test
    const clientCount = service.getClientCount();
    for (let i = 0; i < clientCount; i++) {
      service.removeClient(`client-${i}`);
    }
  });

  describe('addClient', () => {
    it('should add a client and return observable', (done) => {
      const clientId = 'test-client-1';
      const userId = 1;

      const observable = service.addClient(clientId, userId);

      expect(observable).toBeDefined();
      expect(service.getClientCount()).toBe(1);

      // Subscribe to verify observable works
      const subscription = observable.subscribe((event) => {
        expect(event.data).toBeDefined();
        subscription.unsubscribe();
        done();
      });

      // Send a test message
      service.sendToUser(userId, 'test message');
    });

    it('should add multiple clients', () => {
      service.addClient('client-1', 1);
      service.addClient('client-2', 2);
      service.addClient('client-3', 1);

      expect(service.getClientCount()).toBe(3);
    });
  });

  describe('removeClient', () => {
    it('should remove a client', () => {
      const clientId = 'test-client';
      service.addClient(clientId, 1);

      expect(service.getClientCount()).toBe(1);

      service.removeClient(clientId);

      expect(service.getClientCount()).toBe(0);
    });

    it('should handle removing non-existent client', () => {
      service.removeClient('non-existent-client');

      expect(service.getClientCount()).toBe(0);
    });

    it('should complete observable when client is removed', (done) => {
      const clientId = 'test-client';
      const observable = service.addClient(clientId, 1);

      const subscription = observable.subscribe({
        next: () => {},
        complete: () => {
          done();
        },
      });

      service.removeClient(clientId);
    });
  });

  describe('sendToUser', () => {
    it('should send message to specific user', (done) => {
      const userId = 1;
      const message = 'Hello User 1';

      const observable = service.addClient('client-1', userId);

      const subscription = observable.subscribe((event) => {
        expect(event.data).toBe(message);
        subscription.unsubscribe();
        done();
      });

      service.sendToUser(userId, message);
    });

    it('should send message to all connections of a user', (done) => {
      const userId = 1;
      const message = 'Hello User 1';
      let receivedCount = 0;

      const observable1 = service.addClient('client-1', userId);
      const observable2 = service.addClient('client-2', userId);

      const subscription1 = observable1.subscribe((event) => {
        expect(event.data).toBe(message);
        receivedCount++;
        if (receivedCount === 2) {
          subscription1.unsubscribe();
          subscription2.unsubscribe();
          done();
        }
      });

      const subscription2 = observable2.subscribe((event) => {
        expect(event.data).toBe(message);
        receivedCount++;
        if (receivedCount === 2) {
          subscription1.unsubscribe();
          subscription2.unsubscribe();
          done();
        }
      });

      service.sendToUser(userId, message);
    });

    it('should not send message to other users', (done) => {
      const userId1 = 1;
      const userId2 = 2;
      const message = 'Hello User 1';

      const observable1 = service.addClient('client-1', userId1);
      const observable2 = service.addClient('client-2', userId2);

      let user1Received = false;
      let user2Received = false;

      const subscription1 = observable1.subscribe((event) => {
        expect(event.data).toBe(message);
        user1Received = true;
      });

      const subscription2 = observable2.subscribe(() => {
        user2Received = true;
      });

      service.sendToUser(userId1, message);

      setTimeout(() => {
        expect(user1Received).toBe(true);
        expect(user2Received).toBe(false);
        subscription1.unsubscribe();
        subscription2.unsubscribe();
        done();
      }, 100);
    });
  });

  describe('broadcast', () => {
    it('should broadcast message to all clients', (done) => {
      const message = 'Broadcast message';
      let receivedCount = 0;

      const observable1 = service.addClient('client-1', 1);
      const observable2 = service.addClient('client-2', 2);
      const observable3 = service.addClient('client-3', 3);

      const checkComplete = () => {
        receivedCount++;
        if (receivedCount === 3) {
          subscription1.unsubscribe();
          subscription2.unsubscribe();
          subscription3.unsubscribe();
          done();
        }
      };

      const subscription1 = observable1.subscribe((event) => {
        expect(event.data).toBe(message);
        checkComplete();
      });

      const subscription2 = observable2.subscribe((event) => {
        expect(event.data).toBe(message);
        checkComplete();
      });

      const subscription3 = observable3.subscribe((event) => {
        expect(event.data).toBe(message);
        checkComplete();
      });

      service.broadcast(message);
    });

    it('should broadcast to empty client list without error', () => {
      expect(() => {
        service.broadcast('test message');
      }).not.toThrow();
    });
  });

  describe('getClientCount', () => {
    it('should return 0 when no clients', () => {
      expect(service.getClientCount()).toBe(0);
    });

    it('should return correct count of clients', () => {
      service.addClient('client-1', 1);
      service.addClient('client-2', 2);
      service.addClient('client-3', 3);

      expect(service.getClientCount()).toBe(3);
    });

    it('should update count after removing clients', () => {
      service.addClient('client-1', 1);
      service.addClient('client-2', 2);

      expect(service.getClientCount()).toBe(2);

      service.removeClient('client-1');

      expect(service.getClientCount()).toBe(1);
    });
  });

  describe('getUserConnectionCount', () => {
    it('should return 0 for user with no connections', () => {
      expect(service.getUserConnectionCount(1)).toBe(0);
    });

    it('should return correct count for user with single connection', () => {
      service.addClient('client-1', 1);

      expect(service.getUserConnectionCount(1)).toBe(1);
    });

    it('should return correct count for user with multiple connections', () => {
      service.addClient('client-1', 1);
      service.addClient('client-2', 1);
      service.addClient('client-3', 1);

      expect(service.getUserConnectionCount(1)).toBe(3);
    });

    it('should not count connections from other users', () => {
      service.addClient('client-1', 1);
      service.addClient('client-2', 2);
      service.addClient('client-3', 1);

      expect(service.getUserConnectionCount(1)).toBe(2);
      expect(service.getUserConnectionCount(2)).toBe(1);
    });
  });
});
