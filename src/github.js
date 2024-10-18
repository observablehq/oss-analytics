import "dotenv/config";
import {fetchCached as fetch} from "./fetch.js";

const {GITHUB_TOKEN} = process.env;

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
  const response = await fetch(url, {headers});
  if (!response.ok) throw new Error(`failed to fetch ${url}: ${response.status}`);
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
