import { expect, it } from "vitest";
import { inspectZip } from "./zip.js";

function archive(
  name = "index.html",
  crc = 0x3610a686,
  attributes = 0,
  expandedSize = 5,
): Buffer {
  const filename = Buffer.from(name);
  const content = Buffer.from("hello");
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(content.length, 18);
  local.writeUInt32LE(expandedSize, 22);
  local.writeUInt16LE(filename.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50);
  central.writeUInt16LE(0x0314, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(content.length, 20);
  central.writeUInt32LE(expandedSize, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE(attributes, 38);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + filename.length, 12);
  end.writeUInt32LE(local.length + filename.length + content.length, 16);
  return Buffer.concat([local, filename, content, central, filename, end]);
}

it("streams and verifies a complete static bundle", async () => {
  await expect(inspectZip(archive())).resolves.toMatchObject({
    files: 1,
    bytes: 5,
  });
});
it("rejects CRC corruption", async () => {
  await expect(inspectZip(archive("index.html", 0))).rejects.toThrow("CRC");
});
it("rejects ZIP traversal and Unix symlinks", async () => {
  await expect(inspectZip(archive("../index.html"))).rejects.toThrow();
  await expect(
    inspectZip(archive("index.html", 0x3610a686, 0xa1ff0000)),
  ).rejects.toThrow("Links");
});
it("rejects forged expanded sizes and missing entrypoints", async () => {
  await expect(
    inspectZip(archive("index.html", 0x3610a686, 0, 100000000)),
  ).rejects.toThrow();
  await expect(inspectZip(archive("asset.js"))).rejects.toThrow("index.html");
});
