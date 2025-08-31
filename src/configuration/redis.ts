// redis.js
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!); // connects using full URL
const pub = new Redis(process.env.REDIS_URL!);   // publisher
const sub = new Redis(process.env.REDIS_URL!);   // subscriber

export { redis, pub, sub };
