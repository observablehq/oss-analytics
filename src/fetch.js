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
  let path = join(cacheDir, String(u).slice(8));
  if (!path.endsWith(".json")) path += ".json";
  await mkdir(dirname(path), {recursive: true});
  try {
    const {headers, body} = JSON.parse(await readFile(path, "utf-8"));
    return new Response({headers: new Headers(headers), body});
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(url, options);
    if (!response.ok) return response;
    const headers = response.headers;
    const body = await response.json();
    await writeFile(path, JSON.stringify({headers: Object.fromEntries(response.headers), body}), "utf-8");
    return new Response({headers, body});
  }
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
