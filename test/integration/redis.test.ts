import { afterAll, afterEach, beforeAll, describe } from "bun:test";
import { RedisJobStore } from "cronyx";
import { createClient } from "redis";
import { waitUntil } from "../helper";
import { testBehavesLikeCronyxPlugin } from "./shared";

type RedisClientType = ReturnType<typeof createClient>;

describe("integration tests", () => {
  describe("RedisJobStore", () => {
    let client: RedisClientType;
    let jobStore: RedisJobStore;

    beforeAll(async () => {
      client = createClient({ url: Bun.env.REDIS_URI });
      await waitUntil(() => client.connect());

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jobStore = new RedisJobStore(client);
    });

    afterAll(async () => {
      await jobStore.close();
    });

    afterEach(async () => {
      await client.flushAll();
    });

    testBehavesLikeCronyxPlugin(() => jobStore);
  });
});
