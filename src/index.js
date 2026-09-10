import { parseArguments } from './cli/arguments.js';
import { getCoordinates, getForecast } from './api/openMeteo.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    const city = options.cities[0];
    const location = await getCoordinates(city);
    const forecast = await getForecast(
      location.latitude,
      location.longitude,
      options.days,
    );

    console.log({ location, forecast });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
