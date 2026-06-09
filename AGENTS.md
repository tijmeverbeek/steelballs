<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NEVER use external football APIs for results

Do NOT use API-Football, football-data.org, or any other external football/soccer API to fetch match results, standings, or fixtures. The owner does not have a paid subscription and these APIs do not work for this project.

All match results are entered **manually** by the administrator via the instellingen page (`/poule/[code]/instellingen`). Results are stored in the shared `Resultaat` table and apply to both WK poules and LMS poules.
