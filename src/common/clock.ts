import { Injectable } from '@nestjs/common';

export interface IClock {
  now(): Date;
  nowIso(): string;
  today(timezone?: string): string;
  nowTime(timezone?: string): string;
}

@Injectable()
export class Clock implements IClock {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return this.now().toISOString();
  }

  today(timezone = 'Asia/Kolkata'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(this.now());
  }

  nowTime(timezone = 'Asia/Kolkata'): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(this.now());
  }
}

