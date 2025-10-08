import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';
import { BACKEND_BASE, FOOTBALL_ENDPOINT } from '../config/index.ts';
import { type WithId, type Document} from 'mongodb';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

 
async function fetchJSON(endpoint: string) {
  const res = await fetch(`${BACKEND_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
  return res.json();
}

type fetchFileFunction = (url: string, destFolder: string, filename: string) => Promise<void>;

export async function fetchWorkers(
  numberOfWorkers: number = 3,
  urlsAndIds: Record<string, string>,
  folder: string,
  suffix: string,
  exec_func: fetchFileFunction
): Promise<void> {

  const entries = Object.entries(urlsAndIds); // [[url,id], ...]
  let idx = -1; // start before first

  async function worker(): Promise<void> {
    while (true) {
      idx += 1;                       // claim next index
      if (idx >= entries.length) break;

      const [url, id] = entries[idx];
      const fileName = `${id}.${suffix}`;
      await exec_func(url, folder, fileName);
    }
  }

  await Promise.all(Array.from({ length: numberOfWorkers }, () => worker()));
}

async function downloadFile(url: string, destFolder: string, filename: string) {
    mkdirSync(destFolder, { recursive: true });
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch ${url} (${res.status})`);
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(path.join(destFolder, filename), buffer);
    console.log(`Downloaded: ${filename}`);
  }


async function run() {
    console.log('Fetching entities from backend...');
    const countries = await fetchJSON(`${FOOTBALL_ENDPOINT}/countries/fetchAll`) as WithId<Document>[];
    const leagues = await fetchJSON(`${FOOTBALL_ENDPOINT}/leagues/fetchLogos`) as WithId<Document>[];
    const teams = await fetchJSON(`${FOOTBALL_ENDPOINT}/teams/fetchLogos`) as WithId<Document>[];

    const countryRecords: Record<string, string> = Object.fromEntries(
      countries
        .map(doc => ([doc.flag, doc.code ? doc.code.toLowerCase(): null]))
        .filter((p): p is [string, string] => Array.isArray(p))
    );

    const leaguesRecords: Record<string, string> = Object.fromEntries(
      leagues
        .map(doc => ([doc.logo, doc.id]))
        .filter((p): p is [string, string] => Array.isArray(p))
    );

    const teamsRecords: Record<string, string> = Object.fromEntries(
      teams
        .map(doc => ([doc.logo, doc.id]))
        .filter((p): p is [string, string] => Array.isArray(p))
    );

    console.log(`Found ${countries.length} countries`);
    console.log(`Found ${leagues.length} leagues`);
    console.log(`Found ${teams.length} teams`);
  
  
    const flagsFolder = path.resolve(__dirname, '../assets/logos/country');
    const leaguesFolder = path.resolve(__dirname, '../assets/logos/league');
    const teamsFolder = path.resolve(__dirname, '../assets/logos/team');
  
  
    await fetchWorkers(5, countryRecords, flagsFolder, 'svg', downloadFile);
    await fetchWorkers(5, leaguesRecords, leaguesFolder, 'png', downloadFile);
    await fetchWorkers(5, teamsRecords, teamsFolder, 'png', downloadFile);

}

await run();
  


