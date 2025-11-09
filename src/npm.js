import {utcDay, utcYear} from "d3-time";
import {format as formatIso} from "isoformat";
import {fetchCached as fetch} from "./fetch.js";
import {today} from "./today.js";

export async function fetchNpm(path) {
  const url = new URL(path, "https://api.npmjs.org");
  let response;
  let headers;
  for (let attempt = 0, maxAttempts = 3; attempt < maxAttempts; ++attempt) {
    response = await fetch(url);
    headers = response.headers;
    if (response.ok) break;
    console.warn(Object.fromEntries(headers));
    if (headers.get("retry-after")) {
      const retryDelay = headers.get("retry-after") * 1000;
      console.warn(`retry-after ${headers.get("retry-after")}`, retryDelay);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
  return await response.json();
}

export async function fetchNpmDownloads(name, start = utcYear.offset(today, -3), end = today) {
  const data = [];
  let batchStart = end;
  let batchEnd;
  while (batchStart > start) {
    batchEnd = batchStart;
    batchStart = utcYear(utcDay.offset(batchStart, -1)); // align on year for caching
    if (batchStart < start) batchStart = start;
    const formatStart = formatIso(batchStart);
    const formatEnd = formatIso(utcDay.offset(batchEnd, -1)); // inclusive end
    const batch = await fetchNpm(`/downloads/range/${formatStart}:${formatEnd}/${name}`);
    for (const {downloads: value, day: date} of batch.downloads.reverse()) {
      data.push({date: new Date(date), value: value || undefined}); // npm sometimes erroneously reports zeroes
    }
  }
  let i = data.length - 1;
  let j = 0;
  for (; i > 0 && data[i].value === undefined; --i); // trim missing data
  for (; j < i && data[j].value === undefined; ++j); // trim missing data
  return data.slice(j, i + 1);
}
