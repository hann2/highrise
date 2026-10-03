# Tooling ideas

Started 2026-10-03.

- Perfect video capture built into the engine: frames are rendered one at a time and sent to a video, rather than doing a screen recording.
  - 2026-10-03: the first half is in (branch `rig-animations`): `Game.manualFrames` / `Game.stepFrames` run frames by hand, and `npm run clip` drives them from Playwright, a lossless screenshot per frame, encoded with ffmpeg. What's left for the engine: doing it without Playwright (reading the canvas back after each frame, which misses the HTML over it, or the desktop app's `capturePage`), and recording the sound too (an `OfflineAudioContext`, or capturing the master gain's output as frames are stepped).
- An animation editor: drag the hands and points in the rig scene and copy the keyframes out (or keep the animations as JSON, like the characters, and save them from the page through the character editor's server).
