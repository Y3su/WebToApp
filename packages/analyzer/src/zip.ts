import { createHash } from "node:crypto";
import { fromBuffer, type Entry } from "yauzl";

export function validateEntryName(name: string): void {
  if (
    name.length > 240 ||
    !/^[a-zA-Z0-9_./ -]+$/.test(name) ||
    name.startsWith("/") ||
    name
      .split("/")
      .some(
        (part, i, parts) =>
          part === "." ||
          part === ".." ||
          (part === "" && i !== parts.length - 1) ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part),
      )
  )
    throw new Error("Unsafe archive entry path");
}

function crc32Update(crc: number, bytes: Buffer): number {
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc;
}

/** Inspect without extraction. Limits apply to metadata AND streamed decompressed bytes. */
export function inspectZip(
  buffer: Buffer,
): Promise<{ sha256: string; files: number; bytes: number }> {
  if (buffer.length > 32 * 1024 * 1024)
    return Promise.reject(new Error("Archive exceeds 32 MiB"));
  return new Promise((resolve, reject) => {
    fromBuffer(
      buffer,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, zip) => {
        if (error || !zip) {
          reject(error ?? new Error("Invalid ZIP"));
          return;
        }
        let files = 0;
        let total = 0;
        let finished = false;
        const names = new Set<string>();
        const fileNames = new Set<string>();
        const fail = (reason: unknown) => {
          if (finished) return;
          finished = true;
          zip.close();
          reject(reason instanceof Error ? reason : new Error("Invalid ZIP"));
        };
        const deadline = setTimeout(
          () => fail(new Error("Archive inspection deadline exceeded")),
          10_000,
        );
        const cleanup = () => clearTimeout(deadline);
        zip.on("error", (reason: Error) => {
          cleanup();
          fail(reason);
        });
        zip.on("entry", (entry: Entry) => {
          try {
            validateEntryName(entry.fileName);
            const name = entry.fileName.toLowerCase().replace(/\/$/, "");
            if (names.has(name)) throw new Error("Duplicate archive path");
            const parts = name.split("/");
            for (let i = 1; i < parts.length; i++) {
              if (fileNames.has(parts.slice(0, i).join("/")))
                throw new Error("File/directory path collision");
            }
            if (!entry.fileName.endsWith("/")) {
              if (
                [...names].some((existing) => existing.startsWith(name + "/"))
              )
                throw new Error("File/directory path collision");
              fileNames.add(name);
            }
            names.add(name);
            const kind = (entry.externalFileAttributes >>> 16) & 0xf000;
            if (kind !== 0 && kind !== 0x8000 && kind !== 0x4000)
              throw new Error("Links and special files are forbidden");
            if (
              entry.generalPurposeBitFlag & 1 ||
              ![0, 8].includes(entry.compressionMethod)
            )
              throw new Error("Unsupported or encrypted entry");
            if (
              ++files > 2000 ||
              entry.uncompressedSize > 8 * 1024 * 1024 ||
              entry.uncompressedSize > Math.max(entry.compressedSize, 1) * 100
            )
              throw new Error("Archive limits exceeded");
            zip.openReadStream(entry, (streamError, stream) => {
              if (streamError || !stream) {
                cleanup();
                fail(streamError);
                return;
              }
              let bytes = 0;
              let crc = 0xffffffff;
              stream.on("data", (chunk: Buffer) => {
                bytes += chunk.length;
                total += chunk.length;
                crc = crc32Update(crc, chunk);
                if (total > 64 * 1024 * 1024 || bytes > 8 * 1024 * 1024) {
                  stream.destroy(new Error("Expanded archive limit exceeded"));
                }
              });
              stream.on("error", (reason: Error) => {
                cleanup();
                fail(reason);
              });
              stream.on("end", () => {
                if ((crc ^ 0xffffffff) >>> 0 !== entry.crc32) {
                  cleanup();
                  fail(new Error("CRC mismatch"));
                  return;
                }
                if (!finished) zip.readEntry();
              });
            });
          } catch (reason) {
            cleanup();
            fail(reason);
          }
        });
        zip.on("end", () => {
          cleanup();
          if (finished) return;
          if (!fileNames.has("index.html")) {
            fail(new Error("Static bundle requires root index.html"));
            return;
          }
          finished = true;
          resolve({
            sha256: createHash("sha256").update(buffer).digest("hex"),
            files,
            bytes: total,
          });
        });
        zip.readEntry();
      },
    );
  });
}
