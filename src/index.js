import { parseArguments } from './cli/arguments.js';
import { getCoordinates } from './api/openMeteo.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    const city = options.cities[0];
    const coordinates = await getCoordinates(city);

    console.log(coordinates);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
