import { afterAll, beforeAll, beforeEach, describe } from "bun:test";
import { MysqlJobStore, PostgresJobStore, TypeormJobLockEntity } from "cronyx";
import type { TypeormJobLock, TypeormJobStore } from "cronyx";
import { DataSource } from "typeorm";
import type { Repository } from "typeorm";
import { waitUntil } from "../helper";
import { testBehavesLikeCronyxPlugin } from "./shared";

describe.each([
  {
    JobStore: PostgresJobStore,
    dataSource: new DataSource({
      type: "postgres",
      url: Bun.env.POSTGRES_URI,
      entities: [TypeormJobLockEntity],
      synchronize: true,
    }),
  },
  {
    JobStore: MysqlJobStore,
    dataSource: new DataSource({
      type: "mysql",
      url: Bun.env.MYSQL_URI,
      entities: [TypeormJobLockEntity],
      synchronize: true,
    }),
  },
])("integration tests", ({ JobStore, dataSource }) => {
  describe(JobStore.name, () => {
    let jobStore: TypeormJobStore;
    let repository: Repository<TypeormJobLockEntity>;

    beforeAll(async () => {
      await waitUntil(() => dataSource.initialize());

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jobStore = new JobStore(dataSource);
      repository = dataSource.getRepository<TypeormJobLock>(TypeormJobLockEntity);
    });

    afterAll(async () => {
      await jobStore.close();
    });

    beforeEach(async () => {
      await repository.delete({});
    });

    testBehavesLikeCronyxPlugin(() => jobStore);
  });
});
