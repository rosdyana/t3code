import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

import { hashTelemetryId } from "@t3tools/shared/telemetryId";
import * as ServerSecretStore from "../auth/ServerSecretStore.ts";
import { CLOUD_LINKED_USER_ID } from "../cloud/config.ts";

/**
 * Who an install belongs to, from strongest to weakest. `connect` is the T3
 * Connect account. `device` is a client device that connected.
 */
export const TelemetryOwnerSource = Schema.Literals(["connect", "device"]);
export type TelemetryOwnerSource = typeof TelemetryOwnerSource.Type;

export interface TelemetryOwner {
  readonly source: TelemetryOwnerSource;
  /** `hashTelemetryId` of the source's raw id. */
  readonly ownerId: string;
}

/**
 * The owner the server can read without a client: the linked T3 Connect
 * account. Clients add `connect` and `device` owners when they connect.
 */
export const getServerOwners = Effect.gen(function* () {
  const secrets = yield* ServerSecretStore.ServerSecretStore;
  const connectUser = yield* secrets.get(CLOUD_LINKED_USER_ID).pipe(
    Effect.map(Option.map((bytes) => new TextDecoder().decode(bytes))),
    Effect.catch((cause) =>
      Effect.logWarning("Failed to read the linked T3 Connect account for telemetry", {
        errorTag: cause._tag,
      }).pipe(Effect.as(Option.none<string>())),
    ),
  );
  return Option.isSome(connectUser) && connectUser.value.trim() !== ""
    ? [{ source: "connect", ownerId: hashTelemetryId(connectUser.value) } satisfies TelemetryOwner]
    : [];
}).pipe(Effect.withSpan("getServerOwners"));
