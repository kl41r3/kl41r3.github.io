# kl41r3.github.io

Personal site of Yutian (Claire) Wang. Plain HTML, CSS and JS, with no build step.

| File | What it does |
| --- | --- |
| `index.html` | All content: bio, news, publications (with BibTeX), research experience, leadership & service, education |
| `styles.css` | Dark theme (default) and light theme; prints as a one-column CV |
| `main.js` | Theme toggle, sidebar section highlight, BibTeX show/copy, paw-print trail |
| `cat.js` | The pixel cat: loads the sprite sheets, recolours them grey, and runs the yarn chase |
| `assets/` | Avatar, favicon, Open Graph image |
| `assets/cat/` | Cat sprite sheets (idle, walk, run, attack) and their license |

## Run locally

```bash
python3 -m http.server 4173
```

## Deploy

1. Create a public GitHub repo named exactly `kl41r3.github.io`.
2. Push this folder to its `main` branch.
3. Go to Settings → Pages and set the source to "Deploy from a branch", `main`, `/ (root)`.

## Common edits

- **New paper**: copy one `<li class="pub">` block in `index.html`. Badge colours come from the class: `b-venue`, `b-review` (OpenReview), `b-arxiv`, `b-page` (workshop / conference page), `b-award`, `b-bib`.
- **News**: add an `<li>` at the top of the `.news` list.
- **Google Scholar**: add an `<li>` to `.social` in the sidebar. The official logo path is in Simple Icons (`googlescholar`).

## The cat

Sprites are the free version of [Cat 2D Pixel Art](https://xzany.itch.io/cat-2d-pixel-art) by Mattz Art (license in `assets/cat/LICENSE.txt`: free to use and modify inside a project, no redistributing the raw asset, no NFTs). The original cat is orange; `cat.js` maps its colours to grey at load time (`RECOLOR`) and finds the eyes in every frame (used to close them when it naps).

- Click any empty spot on the page to throw a ball of yarn. The cat walks over (or runs, if it's far), pounces, then sits for a moment and walks back to the bottom-right corner. Clicks on links, buttons and BibTeX blocks don't throw yarn.
- Clicking the cat doesn't throw yarn; it only wakes the cat if it's napping.
- After 45 seconds without anyone touching it, it closes its eyes and naps. Hovering, clicking it, or throwing yarn wakes it.
- With "reduce motion" turned on, the cat just sits still.
