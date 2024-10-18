import "dotenv/config";
import {fetchCached as fetch} from "./fetch.js";

const {GITHUB_TOKEN} = process.env;

let ratelimitReset;

export async function fetchGithub(path, options) {
  return (await requestGithub(path, options)).body;
}

export async function requestGithub(
  path,
  {
    authorization = GITHUB_TOKEN && `token ${GITHUB_TOKEN}`,
    accept = "application/vnd.github.v3+json"
  } = {}
) {
  const url = new URL(path, "https://api.github.com");
  const headers = {...(authorization && {authorization}), accept};
  let response;
  for (let attempt = 0, maxAttempts = 3; attempt < maxAttempts; ++attempt) {
    if (ratelimitReset) {
      console.warn(`x-ratelimit-reset ${ratelimitReset}`);
      const ratelimitDelay = new Date(ratelimitReset * 1000) - Date.now();
      await new Promise((resolve) => setTimeout(resolve, ratelimitDelay));
      ratelimitDelay = null;
    }
    response = await fetch(url, {headers});
    const headers = response.headers;
    if (headers["x-ratelimit-remaining"] === "0") ratelimitReset = headers["x-ratelimit-reset"];
    if (response.ok) break;
    if (headers["retry-after"]) {
      console.warn(`retry-after ${retryAfter}`);
      const retryDelay = retryAfter * 1000;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
  return {headers: response.headers, body: await response.json()};
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
