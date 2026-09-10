export function parseArguments(args) {
  let cities = [];
  let days = 3;
  let noCache = false;
  let hasCity = false;

  for (let i = 0; i < args.length; i += 1) {
    const argument = args[i];

    if (argument === '--city') {
      const value = args[i + 1];

      if (value === undefined || value.startsWith('--')) {
        throw new Error('После --city укажите город или список городов.');
      }

      cities = value
        .split(',')
        .map((city) => city.trim())
        .filter((city) => city !== '');

      if (cities.length === 0) {
        throw new Error('Список городов не должен быть пустым.');
      }

      hasCity = true;
      i += 1;
    } else if (argument === '--days') {
      const value = args[i + 1];

      if (
        value === undefined ||
        value.startsWith('--') ||
        value.trim() === ''
      ) {
        throw new Error('После --days укажите количество дней.');
      }

      days = Number(value);

      if (!Number.isInteger(days)) {
        throw new Error('--days должен быть целым числом.');
      }

      if (days < 1 || days > 7) {
        throw new Error('--days должен быть от 1 до 7 включительно.');
      }

      i += 1;
    } else if (argument === '--no-cache') {
      noCache = true;
    } else {
      throw new Error(`Неизвестный аргумент: ${argument}`);
    }
  }

  if (!hasCity) {
    throw new Error('Укажите обязательный параметр --city.');
  }

  return { cities, days, noCache };
}
