import { parseArguments } from './cli/arguments.js';

try {
  const args = process.argv.slice(2);
  const options = parseArguments(args);
  console.log(options);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
