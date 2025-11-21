import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ACCESS_TOKEN_SECRET = 'test_access_secret';
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});
