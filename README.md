# Sovereign Stack

A turn-based strategy game where players build competing AI coalitions across a five-layer technology stack (chips → compute → model → weights → hosting). Everyone starts with the same money; your edge is **what your region has**. You can't build a winning stack alone — the game is won at the **negotiation table**. Across five rounds, world events shift prices and an off-switch die wrecks exposed stacks. **Final score = Adoption × Coherence × Sovereignty + Deals − Fragility.**

Built as a web app with a **riso-print flat world map you lean over like a board game**, and **true cross-device multiplayer** (each player on their own phone/laptop, live cross-table leaderboard).

![Board](screenshots/03-game-market.png)

## Quick start

```bash
npm install
npm run dev
```

This runs **both** the client (Vite, `http://localhost:5173`) and the authoritative game server (`ws://localhost:8787`) together.

- **Practice solo:** open the page → *Start practice game* → add bots → play. No server needed for this mode.
- **Play online (multiple devices):** everyone opens the page and enters the **same table code** (e.g. `OSLO-3`). First to a code hosts it. Up to 6 per table; unlimited parallel tables share one live leaderboard.

### Phones on the same Wi-Fi
The dev server already binds to your LAN. On each phone visit `http://<your-computer-ip>:5173` (printed by Vite as the *Network* URL). The client auto-connects to the game server on the same hostname, port `8787`.

### Deploying for a 40+ person event

The realtime backend is pluggable. Pick whichever host you prefer:

**Option A — Vercel + Firebase (works fully on Vercel; no server to run).**
Rooms-by-code via Firebase Realtime Database, host-authoritative (the host's
browser runs the engine and writes table state; everyone else reads it and
pushes their actions). Setup:

1. Create a Firebase project → add a **Web App** → enable **Realtime Database**.
2. For a one-off event, set the RTDB rules to open (or scope to `tables`/`leaderboard`):
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
3. Copy the web config into env vars (see `.env.example`) and set the same
   `VITE_FIREBASE_*` values in Vercel → Project → Settings → Environment Variables.
4. Deploy the client to Vercel (the included `vercel.json` configures the Vite build).

When `VITE_FIREBASE_*` is present the client uses Firebase automatically; the
Firebase SDK is code-split and only loaded then. (Note: the host/facilitator's
browser must stay open for that table — it's the authority.)

**Option B — one Node service (no Firebase).** The server serves the built
client **and** the WebSocket on one origin, so multiplayer works with no extra
config. Build then run the server:

```bash
npm run build && npm run server   # serves the app + WS on $PORT (default 8787)
```

- **Render:** push to GitHub and create a Blueprint from the included `render.yaml`.
- **Docker** (Fly.io / Railway / Cloud Run / a VPS): the included `Dockerfile` builds and runs everything. The platform's `PORT` is honored.
- Pin a fixed world-event sequence with `EVENT_SEED=<number>`.

**Option C — split (static client on Vercel + your own WS server elsewhere).**
Deploy the client to Vercel, run the server separately (Option B), and point the
client at it at build time:

```bash
VITE_WS_URL=wss://your-server.example.com   # set as a Vercel env var
```

> Transport selection: `VITE_FIREBASE_*` present → Firebase; else `VITE_WS_URL`
> (or `:8787` in dev) → the bundled WS server. A plain static deploy with no
> backend at all still runs **Practice solo** (the engine runs in-browser).

## Multiplayer architecture (§9 Path A)

- `server/index.ts` — a single Node WebSocket process. Holds every table's authoritative state in memory, applies actions, and broadcasts `state` to a table's room + `leaderboard` to everyone on each change.
- The **game engine is shared** between server and client (`src/engine/*`), so logic is identical everywhere. The client sends `GameAction`s; the server is the source of truth. Local practice mode runs the same reducer in-browser.
- Identity is kept in the URL (`?code=&p=`) so a refresh rejoins as the same player — no `localStorage`/`sessionStorage` (which breaks in sandboxed previews, §10.4).

```
src/
  data/        all tunable numbers (regions, 5 layers, events, off-switch, glossary, config)
  engine/      pure logic: pricing · scoring · off-switch · preconditions · reducers · leaderboard
  net/         reconnecting WebSocket client
  store/       Zustand store (online + local transports)
  components/  Term (glossary), board (3D world map + buildings), panels
  screens/     Landing · Lobby · GameScreen · FinalScreen
server/        authoritative realtime server
scripts/       smoke.ts (end-to-end multiplayer test) · shots.mjs (screenshots)
```

## Tuning

Every number lives in `src/data/`. The headline balance lever is `src/data/config.ts` (budget, dice trigger, scoring multipliers). Option costs / adoption / sovereignty are in `src/data/layers.ts`; region discounts in `src/data/regions.ts`; events in `src/data/events.ts`.

Verify the intended lesson still holds after retuning:

```bash
npm run dev          # in one shell
npx tsx scripts/smoke.ts   # in another — plays a full game over the live server
```

It pits a sovereign+open stack against an all-rented/closed stack and asserts the sovereign one wins despite lower raw adoption (the design payload: dependence is punished live).

## Accessibility & motion

- Every real term (weights, fine-tune, sovereign cloud, Nscale, ASML…) has a **dotted underline**; hover/tap for a two-tier definition card. Full list in the in-game Glossary drawer.
- `prefers-reduced-motion` drops orbit/clouds/idle sway and keeps instant state changes.
- Keyboard focus is visible on every control; the board is tiltable/zoomable and defaults to a zoomed-in "your region" view on small screens.

## Art direction

Riso print: locked flat spot-color palette, heavy ink outlines, halftone dot-stipple, paper grain, bold condensed display type, slight off-register. The board is a flat world map tilted with CSS 3D transforms; real AI infrastructure is drawn as little buildings where it actually is, and confirmed deals draw roads between territories (standing deals pulse).
