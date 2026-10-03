import csv from 'csv-parser';
import { Readable } from 'stream';

export class CsvUtils {
  static async parseCsvBuffer<T = any>(buffer: Buffer): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      const stream = Readable.from(buffer.toString('utf-8'));
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }
}
