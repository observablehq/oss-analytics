import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path/posix";

const cacheDir = join("src", ".observablehq", "cache", "_fetch");

const faint = color(2, 22);

function color(code, reset) {
  return process.stdout.isTTY ? (text) => `\x1b[${code}m${text}\x1b[${reset}m` : String;
}

export async function fetchCached(url, options) {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new Error(`unsupported protocol: ${u.protocol}`);
  console.warn(faint("fetch"), String(u));
  let path = join(cacheDir, ...String(u).slice(8).split("/").map(shortenSegment));
  if (!path.endsWith(".json")) path += ".json";
  await mkdir(dirname(path), {recursive: true});
  try {
    const {headers, body} = JSON.parse(await readFile(path, "utf-8"));
    return new Response({headers: new Headers(headers), body});
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    // npm rate-limits with what looks like a token bucket (~16 requests of
    // burst, refilling ~1 request per 6s), so pace every uncached request at
    // the refill rate. Each data loader runs in its own process, so this waits
    // before every request rather than limiting a rate.
    if (u.hostname.endsWith(".npmjs.org")) await new Promise((resolve) => setTimeout(resolve, 6000));
    const response = await fetch(url, options);
    if (!response.ok) return response;
    const headers = response.headers;
    const body = await response.json();
    await writeFile(path, JSON.stringify({headers: Object.fromEntries(response.headers), body}), "utf-8");
    return new Response({headers, body});
  }
}

// File names are limited to 255 bytes, so hash long path segments (such as
// the comma-separated package names of a bulk npm downloads request).
function shortenSegment(segment) {
  return segment.length <= 200 ? segment : createHash("sha256").update(segment).digest("hex");
}

class Response {
  constructor({headers, body}) {
    this.headers = headers;
    this.body = body;
  }
  get ok() {
    return true;
  }
  get status() {
    return 200;
  }
  async json() {
    return this.body;
  }
}
