import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { env } from '../../config/env.config';
import { IdGenerator } from '../../common/id.generator';

export interface UploadResult {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private localUploadDir: string;

  constructor(private readonly idGen: IdGenerator) {
    // In serverless environments (Vercel, AWS Lambda), /var/task is read-only. Use os.tmpdir()
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);

    if (isServerless) {
      this.localUploadDir = path.join(os.tmpdir(), 'uploads');
    } else {
      this.localUploadDir = path.resolve(process.cwd(), 'uploads');
    }

    try {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to create ${this.localUploadDir}, falling back to tmpdir: ${err.message}`);
      this.localUploadDir = path.join(os.tmpdir(), 'uploads');
      try {
        if (!fs.existsSync(this.localUploadDir)) {
          fs.mkdirSync(this.localUploadDir, { recursive: true });
        }
      } catch (tmpErr: any) {
        this.logger.error(`Failed to create fallback tmp upload dir: ${tmpErr.message}`);
      }
    }
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    purpose: string,
  ): Promise<UploadResult> {
    const fileId = this.idGen.generate('fil');
    const ext = path.extname(originalName) || '';
    const storedFileName = `${fileId}${ext}`;
    const filePath = path.join(this.localUploadDir, storedFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/api/v1/files/${fileId}/download`;

    return {
      id: fileId,
      name: originalName,
      url: publicUrl,
      size: buffer.length,
      mimeType,
    };
  }

  async getSignedUrl(fileId: string): Promise<string> {
    return `/api/v1/files/${fileId}/download`;
  }
}
