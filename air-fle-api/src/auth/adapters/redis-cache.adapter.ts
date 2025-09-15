import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ICacheService } from '../interfaces/auth.interface';

@Injectable()
export class RedisCacheAdapter implements ICacheService {
  constructor(
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  async get(key: string): Promise<string | null> {
    return await this.redisService.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisService.set(key, value, ttl);
    } else {
      await this.redisService.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.redisService.get(key);
      return value !== null;
    } catch {
      return false;
    }
  }
}
