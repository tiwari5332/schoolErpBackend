import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommunicationService, DEFAULT_TEMPLATES } from '../src/modules/communication/communication.service';
import { Clock } from '../src/common/clock';
import { IdGenerator } from '../src/common/id.generator';
import { DomainError } from '../src/common/domain.error';

describe('Phase B7: Communication Module Suite', () => {
  const clock = new Clock();
  const idGen = new IdGenerator();
  const tenantId = 'ten_b7_test';

  let mockNotices: any[] = [];
  let mockTemplates: any[] = [];
  let mockThreads: any[] = [];
  let mockMessages: any[] = [];
  let mockStudents: any[] = [];
  let mockStaff: any[] = [];
  let mockUsers: any[] = [];

  const createMockPrisma = () => {
    return {
      saasNotice: {
        findMany: vi.fn(async ({ where, skip = 0, take = 50 }: any) => {
          return mockNotices
            .filter((n) => {
              if (n.tenantId !== where.tenantId) return false;
              if (where.targetAudience && typeof where.targetAudience === 'string' && n.targetAudience !== where.targetAudience) return false;
              if (where.targetAudience && where.targetAudience.in && !where.targetAudience.in.includes(n.targetAudience)) return false;
              return true;
            })
            .slice(skip, skip + take);
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockNotices.filter((n) => {
            if (n.tenantId !== where.tenantId) return false;
            if (where.targetAudience && n.targetAudience !== where.targetAudience) return false;
            return true;
          }).length;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockNotices.find((n) => n.id === where.id && n.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const n = { ...data, createdAt: new Date() };
          mockNotices.push(n);
          return n;
        }),
        delete: vi.fn(async ({ where }: any) => {
          const idx = mockNotices.findIndex((n) => n.id === where.id);
          if (idx !== -1) mockNotices.splice(idx, 1);
        }),
      },
      saasMessageTemplate: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockTemplates.filter((t) => {
            if (t.tenantId !== where.tenantId) return false;
            if (where.channel && t.channel !== where.channel) return false;
            return true;
          });
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockTemplates.find((t) => t.id === where.id && t.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const t = { ...data, createdAt: new Date(), updatedAt: new Date() };
          mockTemplates.push(t);
          return t;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTemplates.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            mockTemplates[idx] = { ...mockTemplates[idx], ...data, updatedAt: new Date() };
            return mockTemplates[idx];
          }
          return null;
        }),
      },
      saasChatThread: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockThreads.filter((t) => t.tenantId === where.tenantId);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockThreads.find((t) => t.id === where.id && t.tenantId === where.tenantId);
        }),
        create: vi.fn(async ({ data }: any) => {
          const t = { ...data, createdAt: new Date() };
          mockThreads.push(t);
          return t;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockThreads.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            mockThreads[idx] = { ...mockThreads[idx], ...data };
            return mockThreads[idx];
          }
          return null;
        }),
      },
      saasChatMessage: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockMessages.filter((m) => m.threadId === where.threadId && m.tenantId === where.tenantId);
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockMessages
            .filter((m) => m.threadId === where.threadId)
            .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())[0];
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockMessages.filter((m) => {
            if (m.threadId !== where.threadId) return false;
            if (where.isRead !== undefined && m.isRead !== where.isRead) return false;
            return true;
          }).length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const m = { ...data, sentAt: new Date() };
          mockMessages.push(m);
          return m;
        }),
        updateMany: vi.fn(async ({ where, data }: any) => {
          for (const m of mockMessages) {
            if (m.threadId === where.threadId) {
              Object.assign(m, data);
            }
          }
        }),
      },
      saasStudent: {
        count: vi.fn(async () => mockStudents.length),
      },
      saasStaff: {
        count: vi.fn(async () => mockStaff.length),
      },
      user: {
        findFirst: vi.fn(async ({ where }: any) => {
          return mockUsers.find((u) => u.id === where.id);
        }),
      },
    };
  };

  let mockPrisma: any;
  let communicationService: CommunicationService;

  beforeEach(() => {
    mockNotices = [];
    mockTemplates = [];
    mockThreads = [];
    mockMessages = [];
    mockStudents = [{ id: 'stu_01' }, { id: 'stu_02' }];
    mockStaff = [{ id: 'stf_01' }];
    mockUsers = [
      { id: 'usr_admin', name: 'Admin Principal' },
      { id: 'usr_parent', name: 'Parent Guardian' },
    ];

    mockPrisma = createMockPrisma();
    communicationService = new CommunicationService(mockPrisma as any, clock, idGen);
  });

  describe('Notices', () => {
    it('creates, retrieves, and deletes circular notices', async () => {
      const notice = await communicationService.createNotice(tenantId, 'usr_admin', {
        title: 'Annual Sports Day 2026',
        body: 'The annual sports meet will be held on December 15th.',
        targetAudience: 'ALL',
        channels: ['IN_APP', 'SMS'],
      });

      expect(notice.id).toBeDefined();
      expect(notice.title).toBe('Annual Sports Day 2026');
      expect(notice.recipientCount).toBeGreaterThan(0);

      const list = await communicationService.getNotices(tenantId, { page: 1, pageSize: 10 });
      expect(list.items.length).toBe(1);

      const fetched = await communicationService.getNoticeById(tenantId, notice.id);
      expect(fetched.title).toBe('Annual Sports Day 2026');

      await communicationService.deleteNotice(tenantId, notice.id);
      expect(mockNotices.length).toBe(0);
    });

    it('estimates recipient count by audience target', async () => {
      const staffCount = await communicationService.calculateRecipientCount(tenantId, {
        targetAudience: 'STAFF',
      });
      expect(staffCount.count).toBe(1);

      const allCount = await communicationService.calculateRecipientCount(tenantId, {
        targetAudience: 'ALL',
      });
      expect(allCount.count).toBe(3);
    });

    it('lists portal notices for parent/student feed', async () => {
      await communicationService.createNotice(tenantId, 'usr_admin', {
        title: 'Parent Teacher Meeting',
        body: 'Meeting scheduled this Saturday.',
        targetAudience: 'PARENTS',
      });

      const portalNotices = await communicationService.getPortalNotices(tenantId);
      expect(portalNotices.items.length).toBe(1);
    });
  });

  describe('Message Templates', () => {
    it('returns default templates and upserts custom templates', async () => {
      const templates = await communicationService.getTemplates(tenantId);
      expect(templates.items.length).toBe(DEFAULT_TEMPLATES.length);

      const upserted = await communicationService.upsertTemplate(tenantId, 'tmpl_custom_exam', {
        name: 'Exam Schedule Notice',
        channel: 'SMS',
        content: 'Exam starts on {{date}}.',
        variables: ['date'],
      });

      expect(upserted.name).toBe('Exam Schedule Notice');
      expect(mockTemplates.length).toBe(1);
    });
  });

  describe('Direct Messages & Chat Threads', () => {
    it('creates chat thread, sends message, lists messages and marks read', async () => {
      const thread = await communicationService.createThread(tenantId, 'usr_admin', {
        subject: 'Academic Progress Inquiry',
        studentId: 'stu_01',
        participantIds: ['usr_parent'],
        initialMessage: 'Dear Parent, how is Aarav doing at home?',
      });

      expect(thread.id).toBeDefined();
      expect(thread.participantIds).toContain('usr_parent');

      // List threads
      const threadsList = await communicationService.getThreads(tenantId, 'usr_parent');
      expect(threadsList.items.length).toBe(1);
      expect(threadsList.items[0].lastMessage?.content).toBe('Dear Parent, how is Aarav doing at home?');

      // Parent replies
      const reply = await communicationService.sendMessage(tenantId, thread.id, 'usr_parent', {
        content: 'He is studying well, thank you!',
      });
      expect(reply.id).toBeDefined();

      const messages = await communicationService.getThreadMessages(tenantId, thread.id);
      expect(messages.items.length).toBe(2);

      // Mark read
      const readRes = await communicationService.markThreadRead(tenantId, thread.id, 'usr_admin');
      expect(readRes.success).toBe(true);
    });
  });
});

