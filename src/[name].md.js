import {parseArgs} from "node:util";

const {
  values: {name}
} = parseArgs({
  options: {name: {type: "string"}}
});

process.stdout.write(`# ${name}

Hello world!
`);
