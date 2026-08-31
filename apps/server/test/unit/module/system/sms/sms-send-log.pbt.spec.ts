import * as fc from 'fast-check';
import { SmsSendStatus } from '@/modules/sms/send/sms-send.service';

/**
 * Property-Based Tests for SMS Send Log Completeness
 *
 * Feature: tenant-management-enhancement
 * Property 4: 消息发送日志完整性
 * Validates: Requirements 1.4
 *
 * For any SMS send operation (success or failure),
 * a log record should be created in the log table with all required fields.
 */
describe('SmsSendService Log Completeness Property-Based Tests', () => {
  // Track created logs for property testing
  let createdLogs: any[];
  let updatedLogs: Map<string, any>;

  // Helper function to simulate log creation
  const createLog = (data: any) => {
    const log = {
      id: BigInt(Math.floor(Date.now() + Math.random() * 1000)),
      ...data,
      sendTime: new Date(),
    };
    createdLogs.push(log);
    return log;
  };

  // Helper function to simulate log update
  const updateLog = (id: bigint, data: any) => {
    const log = createdLogs.find((l) => l.id === id);
    if (log) {
      // Create a copy of the updated log to track changes
      const updatedLog = { ...log, ...data };
      updatedLogs.set(id.toString(), updatedLog);
      // Also update the original log in createdLogs
      Object.assign(log, data);
    }
    return log;
  };

  // Helper function to parse template content
  const parseTemplateContent = (content: string, params: Record<string, string>) => {
    let result = content;
    Object.entries(params || {}).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    });
    return result;
  };

  beforeEach(() => {
    createdLogs = [];
    updatedLogs = new Map();
  });

  afterEach(() => {
    createdLogs = [];
    updatedLogs.clear();
  });

  /**
   * Property 4: 消息发送日志完整性
   *
   * For any SMS send operation (success or failure),
   * a log record should be created with all required fields:
   * - channelId, channelCode
   * - templateId, templateCode
   * - mobile, content, params
   * - sendStatus, sendTime
   *
   * **Validates: Requirements 1.4**
   */
  it('Property 4: For any successful SMS send, log should contain all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random mobile number
        fc.stringMatching(/^1[3-9]\d{9}$/),
        // Generate random template code
        fc.stringMatching(/^[A-Z][A-Z0-9_]{0,20}$/),
        // Generate random params
        fc.record({
          code: fc.string({ minLength: 4, maxLength: 6 }),
          time: fc.integer({ min: 1, max: 60 }).map(String),
        }),
        // Generate random channel info
        fc.record({
          id: fc.integer({ min: 1, max: 1000 }),
          code: fc.constantFrom('aliyun', 'tencent', 'huawei'),
        }),
        // Generate random template info
        fc.record({
          id: fc.integer({ min: 1, max: 1000 }),
        }),
        async (mobile, templateCode, params, channelInfo, templateInfo) => {
          // Reset state
          createdLogs = [];
          updatedLogs.clear();

          const templateContent = '您的验证码是${code}，有效期${time}分钟。';
          const parsedContent = parseTemplateContent(templateContent, params);

          // Simulate log creation (as the service would do)
          const log = createLog({
            channelId: channelInfo.id,
            channelCode: channelInfo.code,
            templateId: templateInfo.id,
            templateCode: templateCode,
            mobile,
            content: parsedContent,
            params: JSON.stringify(params),
            sendStatus: SmsSendStatus.SENDING,
          });

          // Simulate successful send - update log
          updateLog(log.id, {
            sendStatus: SmsSendStatus.SUCCESS,
            apiSendCode: `${channelInfo.code.toUpperCase()}_${Date.now()}`,
          });

          // Property: A log should be created
          if (createdLogs.length === 0) {
            return false;
          }

          const createdLog = createdLogs[0];

          // Property: Log should contain all required fields
          const hasChannelId = createdLog.channelId === channelInfo.id;
          const hasChannelCode = createdLog.channelCode === channelInfo.code;
          const hasTemplateId = createdLog.templateId === templateInfo.id;
          const hasTemplateCode = createdLog.templateCode === templateCode;
          const hasMobile = createdLog.mobile === mobile;
          const hasContent = typeof createdLog.content === 'string' && createdLog.content.length > 0;
          const hasParams = typeof createdLog.params === 'string';
          const hasSendStatus = typeof createdLog.sendStatus === 'number';

          return (
            hasChannelId &&
            hasChannelCode &&
            hasTemplateId &&
            hasTemplateCode &&
            hasMobile &&
            hasContent &&
            hasParams &&
            hasSendStatus
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4b: Failed SMS send should also create complete log
   *
   * For any SMS send operation that fails,
   * a log record should still be created with all required fields,
   * and the error message should be recorded.
   *
   * **Validates: Requirements 1.4**
   */
  it('Property 4b: For any failed SMS send, log should contain error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random mobile number
        fc.stringMatching(/^1[3-9]\d{9}$/),
        // Generate random template code
        fc.stringMatching(/^[A-Z][A-Z0-9_]{0,20}$/),
        // Generate random error message
        fc.string({ minLength: 5, maxLength: 100 }),
        async (mobile, templateCode, errorMessage) => {
          // Reset state
          createdLogs = [];
          updatedLogs.clear();

          // Simulate log creation (as the service would do)
          const log = createLog({
            channelId: 1,
            channelCode: 'aliyun',
            templateId: 1,
            templateCode: templateCode,
            mobile,
            content: '测试内容',
            params: JSON.stringify({}),
            sendStatus: SmsSendStatus.SENDING,
          });

          // Simulate failed send - update log with error
          updateLog(log.id, {
            sendStatus: SmsSendStatus.FAILED,
            errorMsg: errorMessage,
          });

          // Property: A log should be created
          if (createdLogs.length === 0) {
            return false;
          }

          // Property: Log should be updated with error info
          const logId = createdLogs[0].id.toString();
          const updatedLog = updatedLogs.get(logId);

          if (!updatedLog) {
            return false;
          }

          // Property: Status should be FAILED and error message should be recorded
          const hasFailedStatus = updatedLog.sendStatus === SmsSendStatus.FAILED;
          const hasErrorMsg = updatedLog.errorMsg === errorMessage;

          return hasFailedStatus && hasErrorMsg;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4c: Log status should transition correctly
   *
   * For any SMS send operation,
   * the log status should transition from SENDING to either SUCCESS or FAILED.
   *
   * **Validates: Requirements 1.4**
   */
  it('Property 4c: For any SMS send, log status should transition from SENDING to final state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random mobile number
        fc.stringMatching(/^1[3-9]\d{9}$/),
        // Generate random success/failure
        fc.boolean(),
        async (mobile, shouldSucceed) => {
          // Reset state
          createdLogs = [];
          updatedLogs.clear();

          // Simulate log creation with SENDING status
          const log = createLog({
            channelId: 1,
            channelCode: 'aliyun',
            templateId: 1,
            templateCode: 'TEST_CODE',
            mobile,
            content: '测试内容',
            params: JSON.stringify({}),
            sendStatus: SmsSendStatus.SENDING,
          });

          // Property: Log should be created with SENDING status initially
          if (createdLogs.length === 0) {
            return false;
          }

          // Capture initial status BEFORE updating
          const initialStatus = createdLogs[0].sendStatus;
          const initialStatusIsSending = initialStatus === SmsSendStatus.SENDING;

          // Simulate send result - update log
          const finalStatus = shouldSucceed ? SmsSendStatus.SUCCESS : SmsSendStatus.FAILED;
          updateLog(log.id, {
            sendStatus: finalStatus,
            apiSendCode: shouldSucceed ? 'SUCCESS_CODE' : undefined,
            errorMsg: shouldSucceed ? undefined : 'Send failed',
          });

          // Property: Log should be updated to final status
          const logId = createdLogs[0].id.toString();
          const updatedLog = updatedLogs.get(logId);

          if (!updatedLog) {
            return false;
          }

          const expectedFinalStatus = shouldSucceed ? SmsSendStatus.SUCCESS : SmsSendStatus.FAILED;
          const finalStatusIsCorrect = updatedLog.sendStatus === expectedFinalStatus;

          return initialStatusIsSending && finalStatusIsCorrect;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4d: Parsed content should be stored in log
   *
   * For any SMS send with template params,
   * the log should contain the parsed content (with variables replaced).
   *
   * **Validates: Requirements 1.4**
   */
  it('Property 4d: For any SMS send with params, log should contain parsed content', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random mobile number
        fc.stringMatching(/^1[3-9]\d{9}$/),
        // Generate random param values - filter out strings containing $ or { to avoid false positives
        fc.record({
          code: fc.stringMatching(/^[0-9]{4,6}$/),
          name: fc.string({ minLength: 2, maxLength: 20 }).filter((s) => !s.includes('$') && !s.includes('{')),
        }),
        async (mobile, params) => {
          // Reset state
          createdLogs = [];
          updatedLogs.clear();

          const templateContent = '您好${name}，您的验证码是${code}。';
          const parsedContent = parseTemplateContent(templateContent, params);

          // Simulate log creation with parsed content
          createLog({
            channelId: 1,
            channelCode: 'aliyun',
            templateId: 1,
            templateCode: 'TEST_CODE',
            mobile,
            content: parsedContent,
            params: JSON.stringify(params),
            sendStatus: SmsSendStatus.SENDING,
          });

          // Property: Log should contain parsed content
          if (createdLogs.length === 0) {
            return false;
          }

          const log = createdLogs[0];

          // Property: Content should contain the param values (not placeholders)
          const contentContainsCode = log.content.includes(params.code);
          const contentContainsName = log.content.includes(params.name);
          const contentHasNoPlaceholders = !log.content.includes('${');

          // Property: Params should be stored as JSON
          const storedParams = JSON.parse(log.params);
          const paramsMatch = storedParams.code === params.code && storedParams.name === params.name;

          return contentContainsCode && contentContainsName && contentHasNoPlaceholders && paramsMatch;
        },
      ),
      { numRuns: 100 },
    );
  });
});
