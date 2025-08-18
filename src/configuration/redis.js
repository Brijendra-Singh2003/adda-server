// redis.js
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL); // connects using full URL
const pub = new Redis(process.env.REDIS_URL);   // publisher
const sub = new Redis(process.env.REDIS_URL);   // subscriber

module.exports = { redis, pub, sub };
