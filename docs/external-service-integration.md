# External service integration

`src/network-layer.ts` is the boundary for outbound HTTP and WebSocket calls.
The repository does not require a concrete third-party service by default; when
one is added, keep the vendor-specific code behind this adapter layer.

## HTTP services

Create one adapter per external service:

```typescript
import { NetworkLayer } from "../src/index.js";

const catalog = NetworkLayer.createHttpServiceAdapter({
  serviceName: "asset-catalog",
  baseUrl: "https://assets.example.test/api",
  timeoutMs: 5_000,
  defaultHeaders: { accept: "application/json" },
});

const models = await catalog.get<{ id: string; name: string }[]>("/models");
```

`APIClient` implements `ExternalServiceAdapter`, so tests can inject a fake
`fetchImpl` without reaching the network.

## Errors and retries

HTTP failures throw `HttpError`, which includes `serviceName`, `method`, `url`,
`status`, `retryable`, `responseBody`, and `retryAfterMs`. Transport failures
and timeouts throw `ExternalServiceError` with the original `cause`.

Default retry behavior retries network failures plus HTTP `408`, `425`, `429`,
and `5xx` responses. Non-retryable HTTP failures such as `404` are surfaced
immediately. `Retry-After` is honored when present; otherwise exponential
backoff is used.

Use `retry: false` on a request when retries are not safe:

```typescript
await catalog.post("/imports", payload, { retry: false });
```

## WebSocket services

`WebSocketClient` handles message envelopes, offline queuing, reconnect status,
and queued-message flushing. Keep protocol-specific message types in the caller
and use `MessageProtocol` for encode/decode/acknowledgement.
