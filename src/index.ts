import { CronyxArgumentError, CronyxNotFoundError } from "cronyx";
import type { BaseJobStore, JobLockId } from "cronyx";
import { Elysia } from "elysia";
import { CreateBodyDTO, CreateParamsDTO, CreateResponseDTO, UpdateParamsDTO, UpdateResponseDTO } from "./dto";
import Manager from "./manager";

export { CreateBodyDTO, CreateResponseDTO, UpdateResponseDTO };

/**
 * @public
 */
export type IdConverter<I> = (jobId: string) => I;

/**
 * @public
 */
export type CronyxOptions<S extends BaseJobStore<I>, I = JobLockId<S>> = {
  jobStore: S;
  timezone?: string;
  idConverter?: IdConverter<I>;
};

/**
 * @public
 */
export default function cronyx<S extends BaseJobStore<I>, I = JobLockId<S>>(options: CronyxOptions<S, I>) {
  return new Elysia({ name: "cronyx" }).group("/:jobName", (app) =>
    app
      .state("manager", new Manager(options))
      .error("CronyxNotFoundError", CronyxNotFoundError)
      .error("CronyxArgumentError", CronyxArgumentError)
      .onError(({ error, code, set }) => {
        switch (code) {
          case "CronyxNotFoundError":
            set.status = 404;
            break;
          case "CronyxArgumentError":
            set.status = 400;
            break;
          default:
            set.status = 500;
        }
        return { message: error.message };
      })
      .post(
        "/",
        async ({ params, body, store }) => {
          const job = await store.manager.requestJobStart({ ...params, ...body });
          if (!job) return null;

          return {
            id: job.id?.toString() ?? null,
            name: job.name,
            interval: job.interval,
            intervalStartedAt: job.intervalStartedAt.toISOString(),
            intervalEndedAt: job.intervalEndedAt.toISOString(),
            isActive: job.isActive,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
          };
        },
        { params: CreateParamsDTO, body: CreateBodyDTO, response: CreateResponseDTO },
      )
      .put(
        "/:jobId/finish",
        async ({ params, store }) => {
          await store.manager.finishJob(params);
        },
        { params: UpdateParamsDTO, response: UpdateResponseDTO },
      )
      .put(
        "/:jobId/interrupt",
        async ({ params, store }) => {
          await store.manager.interruptJob(params);
        },
        { params: UpdateParamsDTO, response: UpdateResponseDTO },
      ),
  );
}
