import { Injectable } from '@nestjs/common';
import { ulid } from 'ulidx';

export type IdPrefix =
  | 'usr'
  | 'ten'
  | 'pln'
  | 'sub'
  | 'ses'
  | 'cls'
  | 'sec'
  | 'sbj'
  | 'grd'
  | 'stu'
  | 'stf'
  | 'lev'
  | 'evt'
  | 'exm'
  | 'pap'
  | 'fcat'
  | 'fst'
  | 'fln'
  | 'pay'
  | 'ntc'
  | 'thr'
  | 'msg'
  | 'rol'
  | 'ntf'
  | 'apr'
  | 'imp'
  | 'aud'
  | 'ttb'
  | 'per'
  | 'grs'
  | 'fil'
  | 'ord'
  | 'inv'
  | 'sbs'
  | 'rt'
  | 'rtf'
  | 'pwr';

@Injectable()
export class IdGenerator {
  generate(prefix?: IdPrefix | string): string {
    const id = ulid().toLowerCase();
    return prefix ? `${prefix}_${id}` : id;
  }

  static create(prefix?: IdPrefix | string): string {
    const id = ulid().toLowerCase();
    return prefix ? `${prefix}_${id}` : id;
  }
}

