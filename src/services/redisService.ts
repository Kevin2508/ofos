import redisClient from "../config/redis.ts";

interface RedisService {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: any, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
  geoAdd: (
    key: string,
    longitude: number,
    latitude: number,
    member: string
  ) => Promise<number>;
  geoDist: (
    key: string,
    member1: string,
    member2: string,
    unit?: 'km' | 'm'
  ) => Promise<number | null>;
  geoRadius: (
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit?: 'km' | 'm'
  ) => Promise<string[]>;
}

const redisService: RedisService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v
      );
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error);
    }
  },

  async geoAdd(
    key: string,
    longitude: number,
    latitude: number,
    member: string
  ): Promise<number> {
    try {
      const result = await redisClient.geoAdd(key, {
        longitude,
        latitude,
        member,
      });
      return result || 0;
    } catch (error) {
      console.error(`Redis geoAdd error for key ${key}:`, error);
      return 0;
    }
  },

  async geoDist(
    key: string,
    member1: string,
    member2: string,
    unit: 'km' | 'm' = 'km'
  ): Promise<number | null> {
    try {
      const distance = await redisClient.geoDist(
        key,
        member1,
        member2,
        unit as any
      );
      return distance ? parseFloat(distance as any) : null;
    } catch (error) {
      console.error(
        `Redis geoDist error for key ${key}:`,
        error
      );
      return null;
    }
  },

  async geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'km' | 'm' = 'km'
  ): Promise<string[]> {
    try {
      const results = await redisClient.geoRadiusByMember(key, radius, unit as any);
      return results || [];
    } catch (error) {
      console.error(`Redis geoRadius error for key ${key}:`, error);
      return [];
    }
  },
};

export default redisService;