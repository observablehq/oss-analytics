import {utcDay, utcYear} from "d3-time";
import {format as formatIso} from "isoformat";
import {fetchCached as fetch} from "./fetch.js";
import {today} from "./today.js";

export async function fetchNpm(path) {
  const url = new URL(path, "https://api.npmjs.org");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to fetch ${url}: ${response.status}`);
  return await response.json();
}

export async function fetchNpmDownloads(name, start = new Date("2021-01-01"), end = today) {
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
      data.push({date: new Date(date), value});
    }
  }
  for (let i = data.length - 1; i >= 0; --i) {
    if (data[i].value > 0) {
      return data.slice(data[0].value > 0 ? 0 : 1, i + 1); // ignore npm reporting zero for today
    }
  }
  throw new Error("empty dataset");
}
