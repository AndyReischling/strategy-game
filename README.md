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
- Build the client: `npm run build` → static files in `dist/` (host anywhere).
- Run the server somewhere reachable: `npm run server` (set `PORT` as needed). Behind TLS, point the client at it with `VITE_WS_URL=wss://your-server` at build time.

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
