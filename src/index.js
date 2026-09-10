import { parseArguments } from './cli/arguments.js';
import { getWeatherForCity } from './services/weatherService.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    const city = options.cities[0];
    const weather = await getWeatherForCity(city, options.days);

    console.log(weather);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
