import { t } from "elysia";

const DurationDTO = t.Object({
  years: t.Optional(t.Number()),
  months: t.Optional(t.Number()),
  weeks: t.Optional(t.Number()),
  days: t.Optional(t.Number()),
  hours: t.Optional(t.Number()),
  minutes: t.Optional(t.Number()),
  seconds: t.Optional(t.Number()),
});

/**
 * @internal
 */
export const CreateBodyDTO = t.Object({
  jobInterval: t.Union([DurationDTO, t.String(), t.Number()]),
  startBuffer: t.Optional(t.Union([DurationDTO, t.Number()])),
  retryInterval: t.Optional(t.Union([DurationDTO, t.Number()])),
  requiredJobNames: t.Optional(t.Array(t.String())),
  timezone: t.Optional(t.String()),
  noLock: t.Optional(t.Boolean()),
  jobIntervalStartedAt: t.Optional(t.String({ format: "date-time" })),
});

/**
 * @internal
 */
export const CreateParamsDTO = t.Object({
  jobName: t.String(),
});

/**
 * @internal
 */
export const UpdateParamsDTO = t.Object({
  jobName: t.String(),
  jobId: t.String(),
});

/**
 * @internal
 */
export const CreateResponseDTO = t.Nullable(
  t.Object({
    id: t.Nullable(t.String()),
    interval: t.Number(),
    intervalStartedAt: t.String({ format: "date-time" }),
    intervalEndedAt: t.String({ format: "date-time" }),
  }),
);

/**
 * @internal
 */
export const UpdateResponseDTO = t.Void();
