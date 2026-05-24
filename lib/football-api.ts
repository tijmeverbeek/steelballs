const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

export const WK_LEAGUE_ID = parseInt(process.env.FOOTBALL_LEAGUE_ID ?? "1");
export const WK_SEASON = parseInt(process.env.FOOTBALL_SEASON ?? "2026");

// API-Football English team name → onze teamcode
export const API_NAAM_NAAR_CODE: Record<string, string> = {
  "Netherlands": "NED",
  "Senegal": "SEN",
  "Peru": "PER",
  "New Zealand": "NZL",
  "Argentina": "ARG",
  "United States": "USA",
  "Morocco": "MAR",
  "Brazil": "BRA",
  "Croatia": "CRO",
  "Switzerland": "SUI",
  "Australia": "AUS",
  "Germany": "GER",
  "Portugal": "POR",
  "Turkey": "TUR",
  "Spain": "ESP",
  "England": "ENG",
  "Uruguay": "URU",
  "Serbia": "SRB",
  "Ivory Coast": "CIV",
  "Cote d'Ivoire": "CIV",
  "France": "FRA",
  "Nigeria": "NGA",
  "Colombia": "COL",
  "Ecuador": "ECU",
  "Belgium": "BEL",
  "Japan": "JPN",
  "South Korea": "KOR",
  "Korea Republic": "KOR",
  "Chile": "CHI",
  "Mexico": "MEX",
  "Poland": "POL",
  "Cameroon": "CMR",
  "Qatar": "QAT",
};

// Wedstrijdstatus codes die "afgelopen" betekenen
const AFGELOPEN = ["FT", "AET", "PEN"];
// Status codes die "bezig" betekenen
const BEZIG = ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"];

export interface ApiFixture {
  fixture: {
    id: number;
    status: { short: string };
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiSpelerStat {
  player: { name: string };
  statistics: Array<{
    goals: { total: number | null };
    cards: { yellow: number | null };
  }>;
}

function headers() {
  return {
    "x-rapidapi-key": process.env.FOOTBALL_API_KEY!,
    "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
  };
}

async function apiGet<T>(pad: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${pad}`, {
    headers: headers(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${pad}`);
  const json = await res.json();
  return json.response as T;
}

export async function getAfgelopenEnLiveWedstrijden(): Promise<ApiFixture[]> {
  const fixtures = await apiGet<ApiFixture[]>(
    `/fixtures?league=${WK_LEAGUE_ID}&season=${WK_SEASON}`
  );
  return fixtures.filter(
    (f) => AFGELOPEN.includes(f.fixture.status.short) || BEZIG.includes(f.fixture.status.short)
  );
}

export async function getTopscorers(): Promise<ApiSpelerStat[]> {
  return apiGet<ApiSpelerStat[]>(
    `/players/topscorers?league=${WK_LEAGUE_ID}&season=${WK_SEASON}`
  );
}

export async function getTopGeleKaarten(): Promise<ApiSpelerStat[]> {
  return apiGet<ApiSpelerStat[]>(
    `/players/topyellowcards?league=${WK_LEAGUE_ID}&season=${WK_SEASON}`
  );
}
