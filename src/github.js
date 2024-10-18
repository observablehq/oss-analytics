import "dotenv/config";
import {fetchCached as fetch} from "./fetch.js";

const {GITHUB_TOKEN} = process.env;

if (!GITHUB_TOKEN) throw new Error("missing required GITHUB_TOKEN");

export async function fetchGithub(path, options) {
  return (await requestGithub(path, options)).body;
}

export async function requestGithub(
  path,
  {accept = "application/vnd.github.v3+json"} = {}
) {
  const url = new URL(path, "https://api.github.com");
  let response;
  let headers;
  for (let attempt = 0, maxAttempts = 3; attempt < maxAttempts; ++attempt) {
    response = await fetch(url, {
      headers: {
        "User-Agent": "observablehq/oss-analytics",
        "X-GitHub-Api-Version": "2022-11-28",
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept": accept
      }
    });
    headers = response.headers;
    if (response.ok) break;
    console.warn(Object.fromEntries(headers));
    if (headers.get("x-ratelimit-remaining") === "0") {
      const ratelimitDelay = new Date(headers.get("x-ratelimit-reset") * 1000) - Date.now();
      console.warn(`x-ratelimit-reset ${headers.get("x-ratelimit-reset")}`, ratelimitDelay);
      await new Promise((resolve) => setTimeout(resolve, ratelimitDelay));
      continue;
    }
    if (headers.get("retry-after")) {
      const retryDelay = headers.get("retry-after") * 1000;
      console.warn(`retry-after ${headers.get("retry-after")}`, retryDelay);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
  return {headers, body: await response.json()};
}

export async function* listGithub(path, {reverse = true, ...options} = {}) {
  const url = new URL(path, "https://api.github.com");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", "1");
  const first = await requestGithub(String(url), options);
  if (reverse) {
    let prevUrl = findRelLink(first.headers, "last");
    if (prevUrl) {
      do {
        const next = await requestGithub(prevUrl, options);
        yield* next.body.reverse(); // reverse order
        prevUrl = findRelLink(next.headers, "prev");
      } while (prevUrl);
    } else {
      yield* first.body.reverse();
    }
  } else {
    yield* first.body;
    let nextUrl = findRelLink(first.headers, "next");
    while (nextUrl) {
      const next = await requestGithub(nextUrl, options);
      yield* next.body; // natural order
      nextUrl = findRelLink(next.headers, "next");
    }
  }
}

function findRelLink(headers, name) {
  return headers
    .get("link")
    ?.split(/,\s+/g)
    .map((link) => link.split(/;\s+/g))
    .find(([, rel]) => rel === `rel="${name}"`)?.[0]
    .replace(/^</, "")
    .replace(/>$/, "");
}
