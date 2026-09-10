import { parseArguments } from './cli/arguments.js';
import { getWeatherForCities } from './services/weatherService.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    const results = await getWeatherForCities(options.cities, options.days);

    console.log(results);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
