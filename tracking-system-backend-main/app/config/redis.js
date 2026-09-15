require('dotenv').config();
const { createClient } = require('redis');

let client;

const isRedisConfigured = () =>
  Boolean(process.env.REDIS_ENDPOINT && process.env.REDIS_PASSWORD);

const getClient = async () => {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_ENDPOINT,
        port: Number(process.env.REDIS_PORT) || 12821,
      },
    });

    client.on('error', (error) => {
      console.log('Redis error', error);
    });

    await client.connect();
  }

  return client;
};

const redisClient = {
  get: async (key) => {
    const activeClient = await getClient();
    if (!activeClient) return null;

    const data = await activeClient.get(key);
    if (!data) return null;

    return JSON.parse(data);
  },
  set: async (key, value, expire = 60 * 60 * 24 * 30) => {
    const activeClient = await getClient();
    if (!activeClient) return false;

    const data = JSON.stringify(value);
    await activeClient.set(key, data);
    await activeClient.expire(key, expire);
    return true;
  },
  del: async (key) => {
    const activeClient = await getClient();
    if (!activeClient) return false;

    return activeClient.del(key);
  },
};

module.exports = redisClient;
