import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REPORTS_DIRECTORY = path.join(process.cwd(), 'reports');

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

export async function loadReport(city) {
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

  try {
    return JSON.parse(reportContent);
  } catch (error) {
    throw new Error(
      `Кэш для города "${city}" содержит некорректный JSON.`,
      { cause: error },
    );
  }
}

export async function saveReport(weather, city) {
  await mkdir(REPORTS_DIRECTORY, { recursive: true });

  const reportPath = getReportPath(city);
  const reportContent = JSON.stringify(weather, null, 2);

  await writeFile(reportPath, reportContent, 'utf8');

  return reportPath;
}
