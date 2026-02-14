# CLAUDE.md — AI Assistant Guide for Apple2

## Project Overview

**Cindy the Snake** — a classic Snake game recreating the look and feel of an Apple II computer from the early 1980s. Originally written in 6502 assembly language as a graduation project, this is a faithful web recreation using HTML5 Canvas and vanilla JavaScript.

The architecture mirrors the original 6502 design:
- **Backend**: A 40×24 character grid handles game logic and collision detection
- **Frontend**: Canvas renderer draws custom 7×8 bitmap characters for graphics

## Project Structure

```
Apple2/
├── CLAUDE.md       # This file — AI assistant guide
├── index.html      # Entry point — Apple II monitor bezel, CRT effects, canvas
└── game.js         # Complete game engine (backend grid + frontend renderer)
```

### index.html
- Apple II monitor bezel (dark frame with "apple ][" label)
- CRT scanline overlay via CSS repeating gradients
- Screen curvature / vignette effect
- Pixel-perfect rendering (`image-rendering: pixelated`)

### game.js
Single self-executing module containing:
- **Display constants**: 40×24 grid, 7×8 character cells, 3× scale factor
- **Apple II Lo-Res 16-color palette** (authentic hex values)
- **Custom bitmap definitions** (`BITMAPS`): wall, snake head (4 directions), body, tail, food variants — all 7×8 pixel bitmaps encoded as arrays of 7-bit row values
- **Bitmap font** (`FONT`): uppercase A–Z, digits 0–9, punctuation — same 7×8 format
- **Backend engine**: character grid, snake array, collision detection, food spawning
- **Frontend renderer**: `drawBitmap()` draws any 7×8 bitmap at a grid cell; `drawText()` renders strings using the bitmap font
- **Game states**: title screen, playing, paused, game over
- **Input**: arrow keys + WASD for movement, Space to start, P to pause

## Build System

No build step required. This is a vanilla HTML/JS project — open `index.html` directly in any modern browser.

## Development Workflows

### Running the Game

Open `index.html` in a browser. No server needed (all file:// compatible).

### Branching

- Feature branches follow the pattern: `claude/<description>-<id>`
- Push with: `git push -u origin <branch-name>`

### Testing

No automated tests. Manual testing by playing the game in a browser.

### Key Architecture Rules

1. **Backend/frontend separation**: Game logic (collision, snake growth, food spawning) operates on the `grid[][]` character array. The renderer reads `grid[][]` and `snake[]` to draw — it never modifies game state.
2. **Bitmap characters**: All graphics are custom 7×8 pixel bitmaps drawn via `drawBitmap()`. To add new visual elements, define a new bitmap in the `BITMAPS` object.
3. **Font system**: Text rendering uses the `FONT` bitmap lookup. To add characters, add entries to the `buildFont()` function.
4. **No external dependencies**: The project uses zero libraries — vanilla JS and Canvas API only.

## Key Conventions

- Keep this CLAUDE.md file up to date as the project evolves
- Maintain the backend/frontend separation (grid logic vs. canvas rendering)
- All bitmaps use the 7-wide × 8-tall format (arrays of 8 numbers, each 7 bits)
- Use the `PALETTE` object for colors — don't hardcode hex values outside of it
- Prefer editing existing files over creating new ones
- Write clear, descriptive commit messages
- Do not commit secrets, credentials, or environment files

## Dependencies

None. Pure vanilla HTML5 + JavaScript. No npm, no bundler, no frameworks.
