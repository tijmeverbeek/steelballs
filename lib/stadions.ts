export interface Stadion {
  naam: string;
  stad: string;
  land: string;
  capaciteit: number;
}

const stadions: Record<string, Stadion> = {
  "Groep A": { naam: "Lumen Field", stad: "Seattle", land: "VS", capaciteit: 68000 },
  "Groep B": { naam: "AT&T Stadium", stad: "Arlington", land: "VS", capaciteit: 80000 },
  "Groep C": { naam: "NRG Stadium", stad: "Houston", land: "VS", capaciteit: 72000 },
  "Groep D": { naam: "Estadio Azteca", stad: "Mexico-Stad", land: "Mexico", capaciteit: 87000 },
  "Groep E": { naam: "Hard Rock Stadium", stad: "Miami", land: "VS", capaciteit: 65000 },
  "Groep F": { naam: "Estadio Akron", stad: "Guadalajara", land: "Mexico", capaciteit: 49000 },
  "Groep G": { naam: "SoFi Stadium", stad: "Los Angeles", land: "VS", capaciteit: 70000 },
  "Groep H": { naam: "Estadio BBVA", stad: "Monterrey", land: "Mexico", capaciteit: 51000 },
  "CL Finale": { naam: "Allianz Arena", stad: "München", land: "Duitsland", capaciteit: 75000 },
};

export function getStadion(groep: string): Stadion | undefined {
  return stadions[groep];
}
