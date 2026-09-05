# Security analyzer

Library-only inspection boundary. The public API does not accept arbitrary fetch
jobs until authenticated ownership verification and isolated workers are
connected.

- HTTPS and exact allowed origins, port 443, no URL credentials.
- All DNS answers must be public; each redirect is revalidated and resolved.
- The HTTPS connection pins a validated IP while retaining hostname TLS
  validation.
- Fresh connection, no cookies, proxies or forwarded credentials; bounded time
  and bytes.
- ZIP inspection never extracts or executes files. Entry paths, count, size,
  compression ratio, file type, duplicates, directory collisions and CRC are
  checked.
- Conservative ASCII archive paths are intentional for portable packaging.

Deploy URL inspection behind an egress firewall as a second boundary. Content
compatibility and browser behavior analysis are future work. ZIP entry-size
validation follows
[yauzl's streaming API](https://github.com/thejoshwolfe/yauzl).
