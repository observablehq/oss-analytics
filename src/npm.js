import {timeDay, utcDay} from "d3-time";
import {utcFormat} from "d3-time-format";

const formatDate = utcFormat("%Y-%m-%d");

export async function getNpmDownloads(
  name,
  {
    start = new Date("2021-01-01"),
    end = utcDay(timeDay()) // exclusive
  } = {}
) {
  const data = [];
  let batchStart = end;
  let batchEnd;
  while (batchStart > start) {
    batchEnd = batchStart;
    batchStart = utcDay.offset(batchStart, -365);
    if (batchStart < start) batchStart = start;
    const response = await fetch(
      `https://api.npmjs.org/downloads/range/${formatDate(batchStart)}:${formatDate(
        utcDay.offset(batchEnd, -1)
      )}/${name}`
    );
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const batch = await response.json();
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
