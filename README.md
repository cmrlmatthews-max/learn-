# Learn hub

A single page that links the family of self-built learning web apps.

## Files

- `index.html` holds the page and the seven module cards as plain links.
- `hub.css` styles the page with tokens from `/shared-ui/tokens.css`.
- `hub.js` adds search, the Continue row, and the Data section.
- `manifest.webmanifest` and `icons/` make the page installable on a Home Screen.

## Dependencies

The page loads `/shared-ui/tokens.css`, `base.css`, `shell.css`, and `shell.js` from the same origin.
If `window.SharedUI` is missing, the cards still work as plain links. The Continue row and Data section stay hidden.

## Add a module

1. Copy one `<li class="card">` block in `index.html`.
2. Set `data-id` to the repo name. The Continue link uses it to find the resume record.
3. Change the title, description, and URL, and draw a small glyph.

## Continue records

A module writes `learn.resume.<module>` with `SharedUI.resume.set`. The hub shows the three newest records.
The hub ignores records whose URL is on another origin.

## Data

Export saves every `localStorage` entry on this origin as `learn-progress-YYYY-MM-DD.json`.
Import reads a file, shows the entry count, and asks for confirmation before it writes.

## Icons

`icons/icon.svg` is the source. The PNG files come from the same shape drawn with Pillow.
