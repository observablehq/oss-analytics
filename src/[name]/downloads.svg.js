import {parseArgs} from "node:util";
import {fetchNpmDownloads} from "../npm.js";
import {DailyPlot} from "../DailyPlot.js";

const {
  values: {name}
} = parseArgs({
  options: {name: {type: "string"}}
});

const data = await fetchNpmDownloads(name);

process.stdout.write(DailyPlot(data).outerHTML);
