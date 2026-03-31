import { Injectable, Logger } from '@nestjs/common';

const REQUIRED_VARS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
] as const;

const OPTIONAL_VARS = [
  'GEMINI_API_KEY',
  'UPLOAD_DIR',
  'FRONTEND_URL',
  'PORT',
  'RECEIPT_PARSER_PROVIDER',
] as const;

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly config: Record<string, string>;

  constructor() {
    this.config = {};
    const missing: string[] = [];

    for (const key of REQUIRED_VARS) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
      } else {
        this.config[key] = value;
      }
    }

    if (missing.length > 0) {
      this.logger.error(`Missing required environment variables: ${missing.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    for (const key of OPTIONAL_VARS) {
      const value = process.env[key];
      if (value) this.config[key] = value;
    }
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get betterAuthSecret(): string {
    return this.config.BETTER_AUTH_SECRET;
  }

  get betterAuthUrl(): string {
    return this.config.BETTER_AUTH_URL;
  }

  get geminiApiKey(): string | undefined {
    return this.config.GEMINI_API_KEY;
  }

  get uploadDir(): string {
    return this.config.UPLOAD_DIR || 'uploads';
  }

  get frontendUrl(): string {
    return this.config.FRONTEND_URL || 'http://localhost:3000';
  }

  get port(): number {
    return parseInt(this.config.PORT || '3001', 10);
  }

  get receiptParserProvider(): string {
    return this.config.RECEIPT_PARSER_PROVIDER || 'gemini';
  }
}
