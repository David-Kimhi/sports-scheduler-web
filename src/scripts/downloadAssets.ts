// scripts/downloadAssets.ts
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';
import { BACKEND_BASE, FOOTBALL_ENDPOINT } from '../config/index.ts';
import path from 'path';
import { type WithId, type Document} from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

 
async function fetchJSON(endpoint: string) {
  const res = await fetch(`${BACKEND_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
  return res.json();
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


  console.log(`Found ${countries.length} countries`);
  console.log(`Found ${leagues.length} leagues`);
  console.log(`Found ${teams.length} teams`);


  const flagsFolder = path.resolve(__dirname, '../assets/logos/country');
  const leaguesFolder = path.resolve(__dirname, '../assets/logos/league');
  const teamsFolder = path.resolve(__dirname, '../assets/logos/team');


  for (const country of countries) {
    if (!country.name || !country.flag) {
      console.error(`Properties missing for doc ${JSON.stringify(country)}`);
      continue;
    }

    const id = country.code.toLowerCase();
    const url = country.flag;
    await downloadFile(url, flagsFolder, `${id}.svg`);
  }

  for (const league of leagues) {
    if (!league.id || !league.logo) {
      console.error(`Properties missing for doc ${JSON.stringify(league)}`);
      continue;
    }

    const id = league.id;
    const url = league.logo;
    await downloadFile(url, leaguesFolder, `${id}.png`);
  }


  for (const team of teams) {
    if (!team.id || !team.logo) {
      console.error(`Properties missing for doc ${JSON.stringify(team)}`);
      continue;
    }

    const id = team.id;
    const url = team.logo;
    await downloadFile(url, teamsFolder, `${id}.png`);
  }



}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
