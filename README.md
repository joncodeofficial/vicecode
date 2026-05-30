# ViceCode

Play **GTA: Vice City** inside VS Code — directly in the primary sidebar via WebAssembly.

## How it works

ViceCode runs a local HTTP server (port 1986) that serves the game engine from your machine. The sidebar opens a webview with an iframe pointing to that server, giving the game the full browser context it needs (Service Worker, OPFS, SharedArrayBuffer).

No internet required after the first setup. Your game data is stored locally in the browser's OPFS — it persists between sessions.

## Setup

1. Install the extension
2. Click the **palm tree icon** in the Activity Bar
3. Click **Download game.tar.gz** — this opens archive.org in your browser
4. Once downloaded, use **Select game.tar.gz** to import it
5. Wait for the import to finish, then click **Start to play**

> The game data only needs to be imported once. After that it loads instantly.

## Controls

| Action | Key |
|---|---|
| Move | `W A S D` or arrow keys |
| Run | `Shift` |
| Attack / Shoot | `Ctrl` or `Left Click` |
| Enter / Exit vehicle | `F` |
| Camera | Mouse |
| Pause | `Esc` |

## Toolbar

Hover over the top of the game panel to reveal the toolbar:

- **↺ Restart** — reloads the game
- **✕ Close** — hides the sidebar

## Requirements

- VS Code 1.120+
- A copy of `game.tar.gz` (GTA: Vice City game files)
- ~700MB of free browser storage (OPFS)

## Credits

Built on top of the open source re3/reVC port compiled to WebAssembly.

- WASM engine: [@specialist003](https://github.com/okhmanyuk-ev), [@caiiiycuk](https://www.youtube.com/caiiiycuk), [@SerGen](https://t.me/ser_var)
- reVCDOS base: [@Lolendor](https://github.com/Lolendor)
- re3/Vice City source: [SugaryHull/re3](https://github.com/SugaryHull/re3/tree/miami)

> This extension is not affiliated with Rockstar Games. GTA: Vice City is property of Rockstar Games.
