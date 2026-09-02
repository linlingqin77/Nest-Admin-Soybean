import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  /** bcrypt rounds (cost factor) — 12 is industry standard for 2024 */
  private static readonly SALT_ROUNDS = 12;

  /** Default dummy hash used for timing-attack mitigation on non-existent users */
  private static readonly DUMMY_HASH = '$2a$12$dummy.hash.placeholder.to.prevent.timing.attacks...';

  async hash(plain: string): Promise<string> {
    if (!plain) throw new Error('Password is required');
    return bcrypt.hash(plain, PasswordService.SALT_ROUNDS);
  }

  /**
   * Compare password with hash. If hash is null/undefined, use a dummy hash
   * to keep timing constant and prevent username enumeration.
   */
  async compare(plain: string, hash: string | null | undefined): Promise<boolean> {
    const target = hash || PasswordService.DUMMY_HASH;
    return bcrypt.compare(plain || '', target);
  }

  /**
   * Generate a random password (for batch operations or temp passwords)
   */
  generateRandom(length = 16): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}
