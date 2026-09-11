import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

export async function saveReport(weather) {
  const reportsDirectory = path.join(process.cwd(), 'reports');
  await mkdir(reportsDirectory, { recursive: true });

  const cityName = sanitizeCityName(weather.location.name);
  const fileName = `${cityName}-${getLocalDate()}.json`;
  const reportPath = path.join(reportsDirectory, fileName);
  const reportContent = JSON.stringify(weather, null, 2);

  await writeFile(reportPath, reportContent, 'utf8');

  return reportPath;
}
