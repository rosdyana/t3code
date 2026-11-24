import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as Digest from "effect/crypto/Digest";
import * as Effect from "effect/Effect";
import * as Hex from "effect/encoding/Hex";
import * as Layer from "effect/Layer";

import * as ServerSecretStore from "../auth/ServerSecretStore.ts";
import { CLOUD_LINKED_USER_ID } from "../cloud/config.ts";
import * as ServerConfig from "../config.ts";
import * as Identify from "./Identify.ts";

const sha256 = Effect.fn("test.sha256")(function* (value: string) {
  const digest = yield* Digest.Digest;
  return Hex.encode(
    yield* digest.digest(Digest.sha256, new TextEncoder().encode(value)).pipe(Effect.orDie),
  );
});

const layerIdentity = (prefix: string) =>
  Layer.provideMerge(ServerSecretStore.layer, ServerConfig.layerTest(process.cwd(), { prefix }));

it.layer(Layer.mergeAll(NodeServices.layer, NodeCrypto.layer))("telemetry identity", (it) => {
  it.effect("reads only the linked Connect account as an owner", () =>
    Effect.gen(function* () {
      const secrets = yield* ServerSecretStore.ServerSecretStore;
      assert.deepEqual(yield* Identify.getServerOwners, []);

      yield* secrets.set(CLOUD_LINKED_USER_ID, new TextEncoder().encode("user_connect"));

      assert.deepEqual(yield* Identify.getServerOwners, [
        { source: "connect", ownerId: yield* sha256("user_connect") },
      ]);
    }).pipe(Effect.provide(layerIdentity("t3-telemetry-identify-owners-"))),
  );
});
