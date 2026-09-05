# `@webtoapp/sdk-js`

Typed JavaScript access to explicitly enabled WebToApp native capabilities. The
package does not discover raw native globals and does not contain a
`postMessage` fallback. A platform runtime must construct a transport that
already enforces exact-origin and main-frame checks, then inject the resulting
client into the trusted page context.

```ts
import { createWebToAppClient, isWebToAppClient } from "@webtoapp/sdk-js";

const client = createWebToAppClient(runtimeTransport);

if (isWebToAppClient(client)) {
  await client.share.open({ title: "Example", url: "https://example.com" });
}
```

The transport exchanges serialized JSON so neither side can mutate an in-flight
message. Requests and replies are limited to 256 KiB. The runtime must
independently validate every request, confirm that the method is enabled by the
immutable AppSpec, and revalidate URLs and filenames before using them.

Callers can set a timeout or cancel a request without adding cancellation
messages to the native protocol:

```ts
const controller = new AbortController();
const result = await client.files.save(
  {
    url: "https://example.com/invoice.pdf",
    suggestedName: "invoice.pdf",
  },
  { timeoutMs: 30_000, signal: controller.signal },
);
```

Cancellation is local. A late native reply is ignored. Call `dispose()` when a
page or runtime channel is torn down so all pending calls fail promptly.
