import { parseArguments } from './cli/arguments.js';
import { formatWeather } from './format/consoleFormatter.js';
import { getWeatherForCities } from './services/weatherService.js';
import { saveReport } from './storage/reportStorage.js';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    const results = await getWeatherForCities(options.cities, options.days);
    let hasErrors = false;
    let hasPrintedWeather = false;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const reportPath = await saveReport(result.value);

        if (hasPrintedWeather) {
          console.log('');
        }

        console.log(formatWeather(result.value));
        console.log(`Отчёт сохранён: ${reportPath}`);
        hasPrintedWeather = true;
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
