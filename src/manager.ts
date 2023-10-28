import Cronyx, { CronyxError, MongodbJobStore } from "cronyx";
import type { BaseJobStore, Job, JobLockId } from "cronyx";
import { Types } from "mongoose";
import type { IdConverter } from ".";
import { log } from "./util";

/**
 * @internal
 */
export type ManagerOptions<S extends BaseJobStore<I>, I = JobLockId<S>> = {
  jobStore: S;
  timezone?: string;
  idConverter?: IdConverter<I>;
};

/**
 * @internal
 */
export type RequestJobStartOptions = {
  jobName: string;
  jobInterval: Duration | string | number;
  timezone?: string;
  startBuffer?: Duration | number;
  retryInterval?: Duration | number;
  requiredJobNames?: string[];
  noLock?: boolean;
  jobIntervalStartedAt?: string;
};

/**
 * @internal
 */
export type EndJobOptions = {
  jobName: string;
  jobId: string;
};

/**
 * @internal
 */
export default class Manager<S extends BaseJobStore<I>, I = JobLockId<S>> {
  #cronyx: Cronyx<S, I>;
  #jobStore: S;
  #idConverter: IdConverter<I>;

  constructor(options: ManagerOptions<S, I>) {
    this.#cronyx = new Cronyx({ jobStore: options.jobStore, timezone: options.timezone });
    this.#jobStore = options.jobStore;
    if (options.idConverter) {
      this.#idConverter = options.idConverter;
    } else if (options.jobStore instanceof MongodbJobStore) {
      this.#idConverter = (jobId) => new Types.ObjectId(jobId) as I;
    } else {
      this.#idConverter = (jobId) => jobId as I; // For RedisJobStore, MysqlJobStore and PostgresJobStore
    }
  }

  async requestJobStart(options: RequestJobStartOptions): Promise<Job<I> | null> {
    try {
      if (options.noLock && options.jobIntervalStartedAt) {
        const jobIntervalStartedAt = new Date(options.jobIntervalStartedAt);
        return await this.#cronyx.requestJobStart({ ...options, noLock: true, jobIntervalStartedAt });
      }

      return await this.#cronyx.requestJobStart({ ...options, jobIntervalStartedAt: undefined });
    } catch (error) {
      if (error instanceof CronyxError) throw error;

      log("ERROR %O", error);
      throw new CronyxError(`Cannot start job for ${options.jobName}`);
    }
  }

  async finishJob(options: EndJobOptions): Promise<void> {
    try {
      await this.#jobStore.deactivateJobLock(options.jobName, this.#idConverter(options.jobId));
    } catch (error) {
      if (error instanceof CronyxError) throw error;

      log("ERROR %O", error);
      throw new CronyxError(`Cannot finish job for ${options.jobName}`);
    }
  }

  async interruptJob(options: EndJobOptions): Promise<void> {
    try {
      await this.#jobStore.removeJobLock(options.jobName, this.#idConverter(options.jobId));
    } catch (error) {
      if (error instanceof CronyxError) throw error;

      log("ERROR %O", error);
      throw new CronyxError(`Cannot interrupt job for ${options.jobName}`);
    }
  }
}
