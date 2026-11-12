import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
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
  private readonly localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private readonly idGen: IdGenerator) {
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
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

