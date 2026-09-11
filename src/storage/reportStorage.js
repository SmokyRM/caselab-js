import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PRECIPITATION_UNIT,
  REPORTS_DIR,
  TEMPERATURE_UNIT,
} from '../config.js';

const REPORTS_DIRECTORY = path.join(process.cwd(), REPORTS_DIR);

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function sanitizeCityName(city) {
  return city.replace(/[<>:"/\\|?*]/g, '-');
}

function getReportPath(city) {
  const cityName = sanitizeCityName(city);
  const fileName = `${cityName}-${getLocalDate()}.json`;

  return path.join(REPORTS_DIRECTORY, fileName);
}

export async function loadReport(city, days) {
  const reportPath = getReportPath(city);
  let reportContent;

  try {
    reportContent = await readFile(reportPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }

  let cachedWeather;

  try {
    cachedWeather = JSON.parse(reportContent);
  } catch (error) {
    throw new Error(`Кэш для города "${city}" содержит некорректный JSON.`, {
      cause: error,
    });
  }

  const cacheInfo = cachedWeather?.cacheInfo;

  if (
    !cacheInfo ||
    cacheInfo.days !== days ||
    cacheInfo.temperatureUnit !== TEMPERATURE_UNIT ||
    cacheInfo.precipitationUnit !== PRECIPITATION_UNIT
  ) {
    return null;
  }

  return cachedWeather;
}

export async function saveReport(weather, city, days) {
  await mkdir(REPORTS_DIRECTORY, { recursive: true });

  const reportPath = getReportPath(city);
  const report = {
    ...weather,
    cacheInfo: {
      days,
      temperatureUnit: TEMPERATURE_UNIT,
      precipitationUnit: PRECIPITATION_UNIT,
    },
  };
  const reportContent = JSON.stringify(report, null, 2);

  await writeFile(reportPath, reportContent, 'utf8');

  return reportPath;
}
