# /aquaaww/ page source

`site/aquaaww_body.html` and `site/aquaaww.css` are generated from the Figma frame `ISvB8DITuDyrbzcGpdnGNa` node `2915:1746`:

1. Save the Figma "get_design_context" React+Tailwind code as `aq_ctx.js`, download its assets (`assets.mjs` resizes them to webp into `site/aquaaww/img/`).
2. `convert.mjs` turns the JSX into plain HTML (hooks.json adds links, h1/h2, the FAQ card from `faq.html`), Tailwind v4 CLI compiles the classes, `page.css` adds fonts, backdrop, FAQ card and the download dialog.
3. Copy the two outputs into `site/` and run `python3 site/build.py`. The phone layout (< 700px) lives in `site/aquaaww_m.py`.

The paths inside the scripts point at the original scratch folder; adjust them before re-running.
