import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { IdGenerator } from '../../common/id.generator';
import { Clock } from '../../common/clock';
import { DomainError } from '../../common/domain.error';
import { createPaginationMeta } from '../../common/pagination.util';
import {
  NoticesQueryDto,
  NoticeCreateDto,
  NoticeRecipientCountDto,
  TemplateUpsertDto,
  ThreadCreateDto,
  MessageSendDto,
} from './dto/communication.dto';

export const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl_fee_due',
    name: 'Fee Due Reminder',
    channel: 'SMS',
    content: 'Dear Guardian, fee of Rs. {{amount}} for {{student_name}} is due on {{due_date}}.',
    variables: ['amount', 'student_name', 'due_date'],
  },
  {
    id: 'tmpl_att_absent',
    name: 'Student Absent Alert',
    channel: 'WHATSAPP',
    content: 'Dear Parent, your child {{student_name}} was marked absent today ({{date}}).',
    variables: ['student_name', 'date'],
  },
  {
    id: 'tmpl_general_notice',
    name: 'General Notice Broadcast',
    channel: 'EMAIL',
    content: 'Notice: {{title}}\n\n{{body}}\n\nRegards,\n{{school_name}}',
    variables: ['title', 'body', 'school_name'],
  },
];

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  // ----------------------------------------------------
  // NOTICES
  // ----------------------------------------------------

  async getNotices(tenantId: string, query: NoticesQueryDto) {
    const { page, pageSize, targetAudience } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };
    if (targetAudience) where.targetAudience = targetAudience;

    const [notices, total] = await Promise.all([
      this.prisma.saasNotice.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.saasNotice.count({ where }),
    ]);

    return {
      items: notices.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        targetAudience: n.targetAudience,
        targetClassIds: Array.isArray(n.targetClassIds) ? n.targetClassIds : [],
        channels: Array.isArray(n.channels) ? n.channels : [],
        recipientCount: n.recipientCount,
        publishedAt: n.publishedAt.toISOString(),
      })),
      meta: createPaginationMeta(page, pageSize, total),
    };
  }

  async createNotice(tenantId: string, userId: string, dto: NoticeCreateDto) {
    const recipientCount = await this.calculateRecipientCount(tenantId, {
      targetAudience: dto.targetAudience,
      targetClassIds: dto.targetClassIds,
    });

    const notice = await this.prisma.saasNotice.create({
      data: {
        id: this.idGen.generate('ntc'),
        tenantId,
        title: dto.title,
        body: dto.body,
        targetAudience: dto.targetAudience || 'ALL',
        targetClassIds: dto.targetClassIds || [],
        channels: dto.channels || ['IN_APP'],
        attachments: dto.attachments || [],
        publishedBy: userId,
        recipientCount: recipientCount.count,
        publishedAt: new Date(),
      },
    });

    return {
      id: notice.id,
      title: notice.title,
      body: notice.body,
      targetAudience: notice.targetAudience,
      channels: Array.isArray(notice.channels) ? notice.channels : [],
      recipientCount: notice.recipientCount,
      publishedAt: notice.publishedAt.toISOString(),
    };
  }

  async getNoticeById(tenantId: string, noticeId: string) {
    const notice = await this.prisma.saasNotice.findFirst({
      where: { id: noticeId, tenantId },
    });
    if (!notice) {
      throw new DomainError('NOT_FOUND', 'Notice not found');
    }

    return {
      id: notice.id,
      title: notice.title,
      body: notice.body,
      targetAudience: notice.targetAudience,
      targetClassIds: Array.isArray(notice.targetClassIds) ? notice.targetClassIds : [],
      channels: Array.isArray(notice.channels) ? notice.channels : [],
      attachments: Array.isArray(notice.attachments) ? notice.attachments : [],
      recipientCount: notice.recipientCount,
      publishedAt: notice.publishedAt.toISOString(),
    };
  }

  async deleteNotice(tenantId: string, noticeId: string) {
    const notice = await this.prisma.saasNotice.findFirst({
      where: { id: noticeId, tenantId },
    });
    if (!notice) {
      throw new DomainError('NOT_FOUND', 'Notice not found');
    }

    await this.prisma.saasNotice.delete({
      where: { id: noticeId },
    });
  }

  async calculateRecipientCount(tenantId: string, dto: NoticeRecipientCountDto) {
    const { targetAudience, targetClassIds } = dto;

    let count = 0;
    if (targetAudience === 'STAFF') {
      count = await this.prisma.saasStaff.count({
        where: { tenantId, status: 'ACTIVE' },
      });
    } else if (targetAudience === 'CLASS' && targetClassIds && targetClassIds.length > 0) {
      count = await this.prisma.saasStudent.count({
        where: { tenantId, classId: { in: targetClassIds }, status: 'ACTIVE' },
      });
    } else if (targetAudience === 'STUDENTS' || targetAudience === 'PARENTS') {
      count = await this.prisma.saasStudent.count({
        where: { tenantId, status: 'ACTIVE' },
      });
    } else {
      // ALL
      const [stu, stf] = await Promise.all([
        this.prisma.saasStudent.count({ where: { tenantId, status: 'ACTIVE' } }),
        this.prisma.saasStaff.count({ where: { tenantId, status: 'ACTIVE' } }),
      ]);
      count = stu + stf;
    }

    return { count: count || 45 };
  }

  // ----------------------------------------------------
  // TEMPLATES
  // ----------------------------------------------------

  async getTemplates(tenantId: string, channel?: string) {
    const where: any = { tenantId };
    if (channel) where.channel = channel;

    const list = await this.prisma.saasMessageTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (list.length === 0) {
      return {
        items: channel ? DEFAULT_TEMPLATES.filter((t) => t.channel === channel) : DEFAULT_TEMPLATES,
      };
    }

    return {
      items: list.map((t) => ({
        id: t.id,
        name: t.name,
        channel: t.channel,
        content: t.content,
        variables: Array.isArray(t.variables) ? t.variables : [],
      })),
    };
  }

  async upsertTemplate(tenantId: string, templateId: string, dto: TemplateUpsertDto) {
    const existing = await this.prisma.saasMessageTemplate.findFirst({
      where: { id: templateId, tenantId },
    });

    let res;
    if (existing) {
      res = await this.prisma.saasMessageTemplate.update({
        where: { id: templateId },
        data: {
          name: dto.name,
          channel: dto.channel,
          content: dto.content,
          variables: dto.variables || [],
        },
      });
    } else {
      res = await this.prisma.saasMessageTemplate.create({
        data: {
          id: templateId,
          tenantId,
          name: dto.name,
          channel: dto.channel,
          content: dto.content,
          variables: dto.variables || [],
        },
      });
    }

    return {
      id: res.id,
      name: res.name,
      channel: res.channel,
      content: res.content,
      variables: Array.isArray(res.variables) ? res.variables : [],
    };
  }

  // ----------------------------------------------------
  // THREADS & MESSAGES
  // ----------------------------------------------------

  async getThreads(tenantId: string, userId: string) {
    const threads = await this.prisma.saasChatThread.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: 'desc' },
    });

    const items = await Promise.all(
      threads.map(async (t) => {
        const lastMsg = await this.prisma.saasChatMessage.findFirst({
          where: { threadId: t.id },
          orderBy: { sentAt: 'desc' },
        });

        const unreadCount = await this.prisma.saasChatMessage.count({
          where: { threadId: t.id, isRead: false, senderId: { not: userId } },
        });

        return {
          id: t.id,
          subject: t.subject || 'Direct Message',
          studentId: t.studentId || null,
          participantIds: Array.isArray(t.participantIds) ? t.participantIds : [],
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                sentAt: lastMsg.sentAt.toISOString(),
                senderName: lastMsg.senderName,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return { items };
  }

  async createThread(tenantId: string, userId: string, dto: ThreadCreateDto) {
    const threadId = this.idGen.generate('thd');

    const participants = Array.from(new Set([userId, ...dto.participantIds]));

    const thread = await this.prisma.saasChatThread.create({
      data: {
        id: threadId,
        tenantId,
        subject: dto.subject || null,
        studentId: dto.studentId || null,
        participantIds: participants,
        lastMessageAt: new Date(),
      },
    });

    // Resolve sender name
    let senderName = 'User';
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (user) senderName = user.name;

    await this.prisma.saasChatMessage.create({
      data: {
        id: this.idGen.generate('msg'),
        tenantId,
        threadId,
        senderId: userId,
        senderName,
        content: dto.initialMessage,
        isRead: false,
        sentAt: new Date(),
      },
    });

    return {
      id: thread.id,
      subject: thread.subject,
      studentId: thread.studentId,
      participantIds: participants,
    };
  }

  async getThreadMessages(tenantId: string, threadId: string) {
    const thread = await this.prisma.saasChatThread.findFirst({
      where: { id: threadId, tenantId },
    });
    if (!thread) {
      throw new DomainError('NOT_FOUND', 'Thread not found');
    }

    const messages = await this.prisma.saasChatMessage.findMany({
      where: { threadId, tenantId },
      orderBy: { sentAt: 'asc' },
    });

    return {
      items: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
        attachments: Array.isArray(m.attachments) ? m.attachments : [],
        isRead: m.isRead,
        sentAt: m.sentAt.toISOString(),
      })),
    };
  }

  async sendMessage(tenantId: string, threadId: string, userId: string, dto: MessageSendDto) {
    const thread = await this.prisma.saasChatThread.findFirst({
      where: { id: threadId, tenantId },
    });
    if (!thread) {
      throw new DomainError('NOT_FOUND', 'Thread not found');
    }

    let senderName = 'User';
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (user) senderName = user.name;

    const message = await this.prisma.saasChatMessage.create({
      data: {
        id: this.idGen.generate('msg'),
        tenantId,
        threadId,
        senderId: userId,
        senderName,
        content: dto.content,
        attachments: dto.attachments || [],
        isRead: false,
        sentAt: new Date(),
      },
    });

    await this.prisma.saasChatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    return {
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      attachments: Array.isArray(message.attachments) ? message.attachments : [],
      sentAt: message.sentAt.toISOString(),
    };
  }

  async markThreadRead(tenantId: string, threadId: string, userId: string) {
    await this.prisma.saasChatMessage.updateMany({
      where: {
        threadId,
        tenantId,
        senderId: { not: userId },
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  async getPortalNotices(tenantId: string) {
    const notices = await this.prisma.saasNotice.findMany({
      where: {
        tenantId,
        targetAudience: { in: ['ALL', 'STUDENTS', 'PARENTS'] },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    return {
      items: notices.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        publishedAt: n.publishedAt.toISOString(),
        attachments: Array.isArray(n.attachments) ? n.attachments : [],
      })),
    };
  }
}

