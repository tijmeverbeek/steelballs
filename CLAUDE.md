@AGENTS.md

# Werkwijze — altijd volgen

## 1. Plan eerst, bouw daarna
Voordat je iets bouwt, schrijf een plan:
- Wat ga je doen?
- Welke bestanden worden aangepast?
- Wat kan er misgaan?

Wacht op goedkeuring van de gebruiker voordat je begint.

## 2. Bouw stap voor stap
Niet alles tegelijk — één ding per keer.

## 3. Test na elke stap
Draai `npm run build` na elke stap en los fouten op voordat je verder gaat.

## 4. Nooit data hardcoden in .ts bestanden
Gebruik altijd Supabase voor data (spelers, teams, wedstrijden, etc.).

## 5. Push pas als alles werkt
Push naar GitHub alleen als de build slaagt en alles getest is.
Altijd direct naar `main` pushen — geen feature branches, geen pull requests, tenzij de gebruiker dit expliciet vraagt.

## 6. Tussentijdse updates
Als een taak langer dan 10 minuten duurt, geef dan een tussentijdse update.
