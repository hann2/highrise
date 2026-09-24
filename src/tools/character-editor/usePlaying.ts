import { useEffect, useState } from "preact/hooks";
import { onPlayingChange } from "./player";

/** Re-renders the component whenever what's playing changes */
export function usePlaying() {
  const [, setTick] = useState(0);
  useEffect(() => onPlayingChange(() => setTick((n) => n + 1)), []);
}
