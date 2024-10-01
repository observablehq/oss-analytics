import {parseArgs} from "node:util";
import {getNpmDownloads} from "../npm.js";
import {DailyPlot} from "../DailyPlot.js";

const {
  values: {name}
} = parseArgs({
  options: {name: {type: "string"}}
});

const data = await getNpmDownloads(name);

process.stdout.write(DailyPlot(data).outerHTML);
