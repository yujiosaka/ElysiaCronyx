import { afterEach, beforeEach, describe, expect, mock, Mock, spyOn, test } from "bun:test";
import Cronyx, { CronyxArgumentError, CronyxNotFoundError, Job } from "cronyx";
import type { BaseJobStore, RequestJobOptions } from "cronyx";
import { addMilliseconds } from "date-fns";
import Manager from "../src/manager";

describe("Manager", () => {
  const now = new Date();
  const jobId = "cb838fc0-475a-4e65-a690-c83f6a4a8bef";
  const jobName = "jobName";
  const jobInterval = 1000 * 60 * 60; // 1 hour
  const jobIntervalEndedAt = now;
  const lastJobLock = {
    _id: jobId,
    jobName,
    jobInterval,
    jobIntervalEndedAt,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const activatedJobLock = { ...lastJobLock, jobIntervalEndedAt, isActive: true };
  const deactivatedJobLock = { ...activatedJobLock, isActive: false, updatedAt: addMilliseconds(now, 1) };

  let job: Job<string>;
  let jobStore: BaseJobStore<string>;
  let manager: Manager<typeof jobStore>;
  let requestJobStart: Mock<(options: RequestJobOptions) => Promise<typeof job | null>>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    job = new Job(jobStore, lastJobLock);
    jobStore = {
      sync: mock(() => Promise.resolve()),
      close: mock(() => Promise.resolve()),
      fetchLastJobLock: mock(() => Promise.resolve(lastJobLock)),
      activateJobLock: mock(() => Promise.resolve(activatedJobLock)),
      deactivateJobLock: mock(() => Promise.resolve(deactivatedJobLock)),
      removeJobLock: mock(() => Promise.resolve()),
    };
    manager = new Manager({ jobStore });

    requestJobStart = spyOn(Cronyx.prototype, "requestJobStart").mockResolvedValue(job);
  });

  afterEach(() => {
    requestJobStart.mockRestore();
  });

  describe("requestJobStart", () => {
    test("resolves job", async () => {
      const result = await manager.requestJobStart({ jobName, jobInterval });
      expect(requestJobStart).toHaveBeenCalledTimes(1);
      expect(result).toBe(job);
    });

    test("fails to resolve job", async () => {
      requestJobStart = spyOn(Cronyx.prototype, "requestJobStart").mockRejectedValue(
        new CronyxArgumentError(`Cannot activate job lock for ${jobName}`),
      );

      await expect(manager.requestJobStart({ jobName, jobInterval })).rejects.toMatchObject({
        message: `Cannot activate job lock for ${jobName}`,
      });
      expect(requestJobStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("finishJob", () => {
    test("deactivates job lock", async () => {
      await manager.finishJob({ jobName, jobId });
      expect(jobStore.deactivateJobLock).toHaveBeenCalledTimes(1);
    });

    test("fails to deactivate job lock", async () => {
      jobStore.deactivateJobLock = mock(() =>
        Promise.reject(new CronyxNotFoundError(`Cannot find job lock for ${jobName}`)),
      );

      await expect(manager.finishJob({ jobName, jobId })).rejects.toMatchObject({
        message: `Cannot find job lock for ${jobName}`,
      });
      expect(jobStore.deactivateJobLock).toHaveBeenCalledTimes(1);
    });
  });

  describe("interruptJob", () => {
    test("removes job lock", async () => {
      await manager.interruptJob({ jobName, jobId });
      expect(jobStore.removeJobLock).toHaveBeenCalledTimes(1);
    });

    test("fails to removes job lock", async () => {
      jobStore.removeJobLock = mock(() => Promise.reject(new CronyxNotFoundError(`Cannot find job lock for ${jobName}`)));

      await expect(manager.interruptJob({ jobName, jobId })).rejects.toMatchObject({
        message: `Cannot find job lock for ${jobName}`,
      });
      expect(jobStore.removeJobLock).toHaveBeenCalledTimes(1);
    });
  });
});
