import {parseArgs} from "node:util";
import {getNpmDownloadsByDate} from "../npm.js";
import {DailyPlot} from "../DailyPlot.js";

const {
  values: {name}
} = parseArgs({
  options: {name: {type: "string"}}
});

const data = await getNpmDownloadsByDate(name);

process.stdout.write(DailyPlot(data, {foreground: "white", background: "black"}).outerHTML);
