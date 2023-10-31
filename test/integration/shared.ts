import { afterAll, afterEach, beforeAll, beforeEach, expect, setSystemTime, test } from "bun:test";
import type { BaseJobStore, JobLockId } from "cronyx";
import { add, sub } from "date-fns";
import Elysia from "elysia";
import type { Static } from "elysia";
import cronyx from "../../src";
import { CreateResponseDTO, UpdateResponseDTO } from "../../src/dto";

export function testBehavesLikeCronyxPlugin<S extends BaseJobStore<I>, I = JobLockId<S>>(getJobStore: () => S) {
  const requestedAt = new Date("2023-02-03T15:00:00.000Z");
  const firstJobIntervalStartedAt = sub(requestedAt, { days: 1 });
  const firstJobIntervalEndedAt = requestedAt;
  const secondJobIntervalStartedAt = requestedAt;
  const secondJobIntervalEndedAt = add(requestedAt, { days: 1 });
  const timezone = "Asia/Tokyo";
  const jobName = "jobName";
  const jobInterval = 1000 * 60 * 60 * 24; // 1 day
  const jobOptions = {
    jobInterval: "0 0 0 * * *", // daily
  };

  let app: Elysia;

  beforeAll(() => {
    const jobStore = getJobStore();
    app = new Elysia().use(cronyx<S, I>({ jobStore, timezone })).listen(0) as Elysia;
  });

  afterAll(async () => {
    await app.stop();
  });

  beforeEach(() => {
    setSystemTime(requestedAt);
  });

  afterEach(async () => {
    setSystemTime();
  });

  test("reruns job after interruption", async () => {
    // first job with interruption
    const firstJobWithInterruption = await requestJobStart(jobOptions);
    expect(firstJobWithInterruption?.id).not.toBe(null);
    expect(firstJobWithInterruption?.name).toBe(jobName);
    expect(firstJobWithInterruption?.interval).toBe(jobInterval);
    expect(firstJobWithInterruption?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJobWithInterruption?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJobWithInterruption?.isActive).toBe(true);
    expect(firstJobWithInterruption?.createdAt).toBeString();
    expect(firstJobWithInterruption?.updatedAt).toBeString();
    await interruptJob(firstJobWithInterruption!.id);

    // first job
    const firstJob = await requestJobStart(jobOptions);
    expect(firstJob?.id).not.toBe(null);
    expect(firstJob?.name).toBe(jobName);
    expect(firstJob?.interval).toBe(jobInterval);
    expect(firstJob?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJob?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJob?.isActive).toBe(true);
    expect(firstJob?.createdAt).toBeString();
    expect(firstJob?.updatedAt).toBeString();
    await finishJob(firstJob!.id);
  });

  test("does not run next job before start buffer", async () => {
    // first job
    const firstJob = await requestJobStart(jobOptions);
    expect(firstJob?.id).not.toBe(null);
    expect(firstJob?.name).toBe(jobName);
    expect(firstJob?.interval).toBe(jobInterval);
    expect(firstJob?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJob?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJob?.isActive).toBe(true);
    expect(firstJob?.createdAt).toBeString();
    expect(firstJob?.updatedAt).toBeString();
    await finishJob(firstJob!.id);

    const jobOptionsWithStartBuffer = { ...jobOptions, startBuffer: { minutes: 30 } } as const;

    setSystemTime(add(requestedAt, { days: 1 }));

    // second job before start buffer
    const secondJobBeforeStartBuffer = await requestJobStart(jobOptionsWithStartBuffer);
    expect(secondJobBeforeStartBuffer).toBe(null);

    setSystemTime(add(requestedAt, { days: 1, minutes: 30 }));

    // second job after start buffer
    const secondJobAfterStartBuffer = await requestJobStart(jobOptionsWithStartBuffer);
    expect(secondJobAfterStartBuffer?.id).not.toBe(null);
    expect(secondJobAfterStartBuffer?.name).toBe(jobName);
    expect(secondJobAfterStartBuffer?.interval).toBe(jobInterval);
    expect(secondJobAfterStartBuffer?.intervalStartedAt).toBe(secondJobIntervalStartedAt.toISOString());
    expect(secondJobAfterStartBuffer?.intervalEndedAt).toBe(secondJobIntervalEndedAt.toISOString());
    expect(secondJobAfterStartBuffer?.isActive).toBe(true);
    expect(secondJobAfterStartBuffer?.createdAt).toBeString();
    expect(secondJobAfterStartBuffer?.updatedAt).toBeString();
    await finishJob(secondJobAfterStartBuffer!.id);
  });

  test("reruns job after retry interval", async () => {
    // first job without finish
    const firstJobWithoutFinish = await requestJobStart(jobOptions);
    expect(firstJobWithoutFinish?.id).not.toBe(null);
    expect(firstJobWithoutFinish?.name).toBe(jobName);
    expect(firstJobWithoutFinish?.interval).toBe(jobInterval);
    expect(firstJobWithoutFinish?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJobWithoutFinish?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJobWithoutFinish?.isActive).toBe(true);
    expect(firstJobWithoutFinish?.createdAt).toBeString();
    expect(firstJobWithoutFinish?.updatedAt).toBeString();

    const jobOptionsWithRetryInterval = { ...jobOptions, retryInterval: { days: 1 } } as const;

    // first job before retry interval
    const firstJobBeforeRetryInterval = await requestJobStart(jobOptionsWithRetryInterval);
    expect(firstJobBeforeRetryInterval).toBe(null);

    setSystemTime(add(requestedAt, { days: 2 }));

    // first job after retry interval
    const firstJobAfterRetryInterval = await requestJobStart(jobOptionsWithRetryInterval);
    expect(firstJobAfterRetryInterval?.id).not.toBe(null);
    expect(firstJobAfterRetryInterval?.name).toBe(jobName);
    expect(firstJobAfterRetryInterval?.interval).toBe(jobInterval);
    expect(firstJobAfterRetryInterval?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJobAfterRetryInterval?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJobAfterRetryInterval?.isActive).toBe(true);
    expect(firstJobAfterRetryInterval?.createdAt).toBeString();
    expect(firstJobAfterRetryInterval?.updatedAt).toBeString();
    await finishJob(firstJobAfterRetryInterval!.id);
  });

  test("runs job with no lock", async () => {
    const jobOptionsWithNoLock = { ...jobOptions, noLock: true } as const;

    // first job without finish
    const firstJobWithoutFinish = await requestJobStart(jobOptionsWithNoLock);
    expect(firstJobWithoutFinish?.id).toBe(null);
    expect(firstJobWithoutFinish?.name).toBe(jobName);
    expect(firstJobWithoutFinish?.interval).toBe(jobInterval);
    expect(firstJobWithoutFinish?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJobWithoutFinish?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJobWithoutFinish?.isActive).toBe(true);
    expect(firstJobWithoutFinish?.createdAt).toBeString();
    expect(firstJobWithoutFinish?.updatedAt).toBeString();

    // first job with interruption
    const firstJobWithFinish = await requestJobStart(jobOptionsWithNoLock);
    expect(firstJobWithFinish?.id).toBe(null);
    expect(firstJobWithFinish?.name).toBe(jobName);
    expect(firstJobWithFinish?.interval).toBe(jobInterval);
    expect(firstJobWithFinish?.intervalStartedAt).toBe(firstJobIntervalStartedAt.toISOString());
    expect(firstJobWithFinish?.intervalEndedAt).toBe(firstJobIntervalEndedAt.toISOString());
    expect(firstJobWithFinish?.isActive).toBe(true);
    expect(firstJobWithFinish?.createdAt).toBeString();
    expect(firstJobWithFinish?.updatedAt).toBeString();

    // second job with specified job interval started at
    const secondJob = await requestJobStart({ ...jobOptionsWithNoLock, jobIntervalStartedAt: secondJobIntervalStartedAt });
    expect(secondJob?.id).toBe(null);
    expect(secondJob?.name).toBe(jobName);
    expect(secondJob?.interval).toBe(0);
    expect(secondJob?.intervalStartedAt).toBe(secondJobIntervalStartedAt.toISOString());
    expect(secondJob?.intervalEndedAt).toBe(secondJobIntervalStartedAt.toISOString());
    expect(secondJob?.isActive).toBe(true);
    expect(secondJob?.createdAt).toBeString();
    expect(secondJob?.updatedAt).toBeString();
  });

  test("interrupts finished job", async () => {
    // first job without finish
    const firstJob = await requestJobStart(jobOptions);
    await finishJob(firstJob!.id);

    const error = await interruptJob(firstJob!.id);
    expect(error).toMatchObject({ message: "Cannot find job lock for jobName" });
  });

  test("finishes interrupted job", async () => {
    // first job without finish with interruption
    const firstJob = await requestJobStart(jobOptions);
    await interruptJob(firstJob!.id);

    const error = await finishJob(firstJob!.id);
    expect(error).toMatchObject({ message: "Cannot find job lock for jobName" });
  });

  async function requestJobStart(options: object): Promise<Static<typeof CreateResponseDTO>> {
    const response = await fetch(`http://localhost:${app.server!.port}/jobName`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    return await response.json();
  }

  async function finishJob(jobId: string | null): Promise<Static<typeof UpdateResponseDTO>> {
    const response = await fetch(`http://localhost:${app.server!.port}/${jobName}/${jobId}/finish`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  }

  async function interruptJob(jobId: string | null): Promise<Static<typeof UpdateResponseDTO>> {
    const response = await fetch(`http://localhost:${app.server!.port}/${jobName}/${jobId}/interrupt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  }
}
