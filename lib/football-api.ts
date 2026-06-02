const BASE_URL = "https://v3.football.api-sports.io";

export const WK_LEAGUE_ID = parseInt(process.env.FOOTBALL_LEAGUE_ID ?? "1");
export const WK_SEASON = parseInt(process.env.FOOTBALL_SEASON ?? "2026");

export const UCL_LEAGUE_ID = 2;
export const UCL_SEASON = 2025; // CL 2025-26, api-football uses start year

export const UCL_NAAM_NAAR_CODE: Record<string, string> = {
  "Paris Saint-Germain": "PSG",
  "Arsenal": "ARS",
};

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

export interface ApiTeamSquad {
  team: { id: number; name: string };
  players: Array<{
    id: number;
    name: string;
    position: string; // "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
  }>;
}

export interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  type: string;   // "Goal" | "Card" | "subst" | "Var"
  detail: string; // "Normal Goal" | "Own Goal" | "Penalty" | ...
}

export function apiPositieNaarOnze(apiPositie: string): string {
  if (apiPositie === "Goalkeeper") return "DOE";
  if (apiPositie === "Defender") return "VER";
  if (apiPositie === "Midfielder") return "MID";
  return "AAN";
}

function headers() {
  return {
    "x-apisports-key": process.env.FOOTBALL_API_KEY!,
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

export async function getAfgelopenEnLiveWedstrijdenVoorLeague(leagueId: number, season: number): Promise<ApiFixture[]> {
  const fixtures = await apiGet<ApiFixture[]>(
    `/fixtures?league=${leagueId}&season=${season}`
  );
  return fixtures.filter(
    (f) => AFGELOPEN.includes(f.fixture.status.short) || BEZIG.includes(f.fixture.status.short)
  );
}

export async function getAfgelopenEnLiveWedstrijden(): Promise<ApiFixture[]> {
  return getAfgelopenEnLiveWedstrijdenVoorLeague(WK_LEAGUE_ID, WK_SEASON);
}

export async function getTeamsVoorLeague(leagueId: number, season: number): Promise<Array<{ id: number; naam: string }>> {
  const response = await apiGet<Array<{ team: { id: number; name: string } }>>(
    `/teams?league=${leagueId}&season=${season}`
  );
  return response.map((r) => ({ id: r.team.id, naam: r.team.name }));
}

export async function getSpelersVoorTeam(teamId: number): Promise<Array<{ naam: string; positie: string }>> {
  const response = await apiGet<ApiTeamSquad[]>(`/players/squads?team=${teamId}`);
  const squad = response[0]?.players ?? [];
  return squad.map((p) => ({ naam: p.name, positie: apiPositieNaarOnze(p.position) }));
}

export async function getFixtureEvents(fixtureId: number): Promise<ApiEvent[]> {
  return apiGet<ApiEvent[]>(`/fixtures/events?fixture=${fixtureId}`);
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

export const NL_TEAM_ID = 1118;

export interface NLWedstrijdInfo {
  fixtureId: number;
  thuisNaam: string;
  uitNaam: string;
  thuisId: number;
  uitId: number;
  datum: string;
  tijd: string;
}

export async function getNLVolgendeWedstrijd(): Promise<NLWedstrijdInfo | null> {
  const data = await apiGet<Array<{
    fixture: { id: number; date: string };
    teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  }>>(`/fixtures?team=${NL_TEAM_ID}&next=1`);

  if (!data || data.length === 0) return null;
  const f = data[0];
  const dateStr = f.fixture.date; // e.g. "2026-06-03T20:00:00+02:00"

  return {
    fixtureId: f.fixture.id,
    thuisNaam: f.teams.home.name,
    uitNaam: f.teams.away.name,
    thuisId: f.teams.home.id,
    uitId: f.teams.away.id,
    datum: dateStr.slice(0, 10),
    tijd: dateStr.slice(11, 16),
  };
}
