import { lookup } from "node:dns/promises";
import { request } from "node:https";
import ipaddr from "ipaddr.js";

export function isPublicAddress(address: string): boolean {
  try {
    // Reject mapped/translated IPv6 as well as private, reserved and multicast ranges.
    return ipaddr.parse(address).range() === "unicast";
  } catch {
    return false;
  }
}

export function validateTarget(
  input: string,
  allowedOrigins: readonly string[],
): URL {
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !allowedOrigins.includes(url.origin)
  )
    throw new Error(
      "URL must use an explicitly allowed HTTPS origin on port 443",
    );
  return url;
}

type Resolver = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;
export async function inspectUrl(
  input: string,
  allowedOrigins: readonly string[],
  resolve: Resolver = (hostname) =>
    lookup(hostname, { all: true, verbatim: true }),
): Promise<{
  finalUrl: string;
  status: number;
  bytes: number;
  contentType: string;
}> {
  const signal = AbortSignal.timeout(15_000);
  let url = validateTarget(input, allowedOrigins);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const addresses = await Promise.race([
      resolve(url.hostname.replace(/^\[|\]$/g, "")),
      new Promise<never>((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new Error("Inspection deadline exceeded")),
          { once: true },
        );
      }),
    ]);
    signal.throwIfAborted();
    if (
      !addresses.length ||
      addresses.some(({ address }) => !isPublicAddress(address))
    ) {
      throw new Error("DNS target contains a non-public address");
    }
    const pinned = addresses[0]!;
    const response = await new Promise<{
      status: number;
      location?: string;
      bytes: number;
      contentType: string;
    }>((resolveResponse, reject) => {
      const req = request(
        url,
        {
          agent: false,
          family: pinned.family,
          signal,
          // The connection uses the validated IP; Host and TLS verification retain the hostname.
          lookup: (_hostname, _options, callback) =>
            callback(null, pinned.address, pinned.family),
          headers: {
            "user-agent": "WebToApp-Analyzer/0.1",
            "accept-encoding": "identity",
          },
        },
        (res) => {
          let bytes = 0;
          res.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > 2 * 1024 * 1024)
              res.destroy(new Error("Response exceeds 2 MiB"));
          });
          res.on("error", reject);
          res.on("end", () =>
            resolveResponse({
              status: res.statusCode ?? 0,
              ...(res.headers.location
                ? { location: res.headers.location }
                : {}),
              bytes,
              contentType: res.headers["content-type"] ?? "",
            }),
          );
        },
      );
      req.on("error", reject);
      req.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (!response.location || redirects === 3)
        throw new Error("Invalid or excessive redirects");
      url = validateTarget(
        new URL(response.location, url).href,
        allowedOrigins,
      );
      continue;
    }
    return {
      finalUrl: url.href,
      status: response.status,
      bytes: response.bytes,
      contentType: response.contentType,
    };
  }
  throw new Error("Redirect limit exceeded");
}
