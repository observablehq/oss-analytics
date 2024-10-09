import {parseArgs} from "node:util";
import {format as formatIso} from "isoformat";
import {getNpmDownloadsByDate} from "../../npm.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

const data = await getNpmDownloadsByDate(`@${scope}/${name}`);

process.stdout.write(JSON.stringify(data, replacer));

function replacer(key, value) {
  return value && /(_|^)(date|time)$/.test(key) ? formatIso(new Date(value)) : value;
}
