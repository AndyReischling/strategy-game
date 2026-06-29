import { useEffect } from "react";
import { useGame } from "./store/useGame";
import { Landing } from "./screens/Landing";
import { Lobby } from "./screens/Lobby";
import { GameScreen } from "./screens/GameScreen";
import { Toast } from "./components/Toast";
import { GlossaryDrawer } from "./components/GlossaryDrawer";
import { HowToPlay } from "./components/HowToPlay";

export function App() {
  const transport = useGame((s) => s.transport);
  const table = useGame((s) => s.table);
  const tryAutoRejoin = useGame((s) => s.tryAutoRejoin);

  useEffect(() => {
    tryAutoRejoin();
  }, [tryAutoRejoin]);

  let screen;
  if (transport === "none" || !table) {
    screen = <Landing />;
  } else if (table.phase === "lobby") {
    screen = <Lobby />;
  } else {
    screen = <GameScreen />;
  }

  return (
    <>
      {screen}
      <Toast />
      <GlossaryDrawer />
      <HowToPlay />
    </>
  );
}
