# Product analytics

This fork sends no product analytics, relay traces, or crash reports off the machine.

- [`AnalyticsService`](../../apps/server/src/telemetry/AnalyticsService.ts) keeps its interface so
  callers compile, but `record` always returns `false` (the same answer as telemetry being off), so
  nothing is buffered or sent. `FeedbackService` stores reports locally and never sends them; the
  server no longer advertises the `agentFeedback` capability, so clients hide its setting.
- [`relayTracing`](../../packages/shared/src/relayTracing.ts) has no exporter. `RelayClientTracer`
  stays `None`, so `withRelayClientTracing` is a pass-through on server, web, and mobile.
- The server reports `observability.relayTracingAllowed: false` so stock T3 Code clients that
  connect to it do not send relay traces either. Clients treat a missing field as allowed, so keep it.
- Mobile `expo-observe` stays linked (removing it needs a native rebuild) but is configured with
  dispatching off and an `.invalid` endpoint; without an endpoint it would fall back to Expo's ingest.
- User-configured OTLP export (Settings > Diagnostics, `T3CODE_OTLP_*`, `OTEL_EXPORTER_OTLP_*`)
  is unaffected: it only sends to endpoints the user enters.
