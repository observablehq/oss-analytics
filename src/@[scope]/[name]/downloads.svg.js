import {parseArgs} from "node:util";
import {getNpmDownloads} from "../../npm.js";
import {DailyPlot} from "../../DailyPlot.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

const data = await getNpmDownloads(`@${scope}/${name}`);

process.stdout.write(DailyPlot(data).outerHTML);
