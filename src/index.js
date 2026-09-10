import { parseArguments } from './cli/arguments.js';
import { getWeatherForCities } from './services/weatherService.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    const results = await getWeatherForCities(options.cities, options.days);
    let hasErrors = false;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        console.log(result.value);
      } else {
        console.error(
          `Ошибка для города "${result.city}": ${result.reason.message}`
        );
        hasErrors = true;
      }
    }

    if (hasErrors) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
