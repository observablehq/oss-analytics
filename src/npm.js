import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path/posix";
import {utcDay, utcYear} from "d3-time";
import {format as formatIso} from "isoformat";
import {packages} from "../observablehq.config.js";
import {fetchCached as fetch} from "./fetch.js";
import {today} from "./today.js";

export async function fetchNpm(path) {
  const url = new URL(path, "https://api.npmjs.org");
  for (let attempt = 1, maxAttempts = 5; ; ++attempt) {
    const response = await fetch(url, {headers: {"User-Agent": "observablehq/oss-analytics"}});
    if (response.ok) return await response.json();
    // npm answers 429 (with retry-after: 0) once its rate limit is exhausted;
    // back off long enough for it to refill rather than failing outright.
    if (response.status === 429 && attempt < maxAttempts) {
      const retryDelay = Math.max(response.headers.get("retry-after") * 1000, 60_000 * attempt);
      console.warn(`429 rate limited; retrying in ${retryDelay}ms (attempt ${attempt} of ${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }
    console.warn(Object.fromEntries(response.headers));
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
}

// Unscoped packages are fetched in bulk (scoped packages aren’t supported by
// the bulk API); every loader uses the same list so they share a cached URL.
const bulkMax = 128;
const bulkNames = Array.from(new Set(packages.map((p) => p.name).filter((name) => !name.startsWith("@")))).sort();
const bulkChunks = Array.from({length: Math.ceil(bulkNames.length / bulkMax)}, (_, i) => bulkNames.slice(i * bulkMax, (i + 1) * bulkMax)); // prettier-ignore

async function fetchNpmDownloadsRange(name, period) {
  const chunk = bulkChunks.find((chunk) => chunk.includes(name));
  if (!chunk) return await fetchNpm(`/downloads/range/${period}/${name}`);
  return (await fetchNpm(`/downloads/range/${period}/${chunk.join(",")}`))[name] ?? {downloads: []};
}

// Downloads for completed years never change, so they’re committed to the
// repo; a missing year is fetched and written here, and should be committed.
const archiveDir = join("data", "npm-downloads");

async function fetchNpmDownloadsYear(name, year) {
  const path = join(archiveDir, String(year), `${name}.json`);
  try {
    return JSON.parse(await readFile(path, "utf-8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const data = await fetchNpmDownloadsRange(name, `${year}-01-01:${year}-12-31`);
    await mkdir(dirname(path), {recursive: true});
    await writeFile(path, JSON.stringify(data), "utf-8");
    console.warn(`wrote ${path}; please commit it`);
    return data;
  }
}

export async function fetchNpmDownloads(name, start = utcYear.offset(today, -3), end = today) {
  const data = [];
  let batchStart = end;
  let batchEnd;
  while (batchStart > start) {
    batchEnd = batchStart;
    batchStart = utcYear(utcDay.offset(batchStart, -1)); // align on year for caching
    const formatStart = formatIso(batchStart);
    const formatEnd = formatIso(utcDay.offset(batchEnd, -1)); // inclusive end
    const {downloads: batch} =
      +utcYear.offset(batchStart, 1) === +batchEnd // a completed year
        ? await fetchNpmDownloadsYear(name, batchStart.getUTCFullYear())
        : await fetchNpmDownloadsRange(name, `${formatStart}:${formatEnd}`);
    for (const {downloads: value, day: date} of batch.slice().reverse()) {
      if (new Date(date) < start) continue; // the earliest batch is a whole year
      data.push({date: new Date(date), value: value || undefined}); // npm sometimes erroneously reports zeroes
    }
  }
  let i = data.length - 1;
  let j = 0;
  for (; i > 0 && data[i].value === undefined; --i); // trim missing data
  for (; j < i && data[j].value === undefined; ++j); // trim missing data
  return data.slice(j, i + 1);
}
