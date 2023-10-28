import { afterAll, afterEach, beforeAll, describe } from "bun:test";
import { MongodbJobStore } from "cronyx";
import type { MongodbJobLock } from "cronyx";
import type { Connection, Model } from "mongoose";
import { createConnection } from "mongoose";
import { waitUntil } from "../helper";
import { testBehavesLikeCronyxPlugin } from "./shared";

describe("integration tests", () => {
  describe("MongodbJobStore", () => {
    let conn: Connection;
    let jobStore: MongodbJobStore;
    let model: Model<MongodbJobLock>;

    beforeAll(async () => {
      conn = createConnection(Bun.env.MONGO_URI!);
      await waitUntil(() => conn.asPromise());

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jobStore = new MongodbJobStore(conn);
      model = conn.models.JobLock;
    });

    afterAll(async () => {
      await jobStore.close();
    });

    afterEach(async () => {
      await model.deleteMany({});
    });

    testBehavesLikeCronyxPlugin(() => jobStore);
  });
});
