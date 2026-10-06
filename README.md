# Harsh — Portfolio

A portfolio site for **Harsh** — web developer building **websites, apps and AI products**.

Design direction is modelled on [marcuslorenzet.com](https://www.marcuslorenzet.com/): near-black canvas,
cream typography, oversized grotesk headlines, monospace micro-labels, a pinned horizontal project
gallery, scroll-linked word reveals and a floating dock navigation.

Plain HTML, CSS and JavaScript — **no build step, no dependencies**.

## Run it

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works (Netlify, Vercel, GitHub Pages, Cloudflare Pages): upload the folder as-is.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home — hero, marquee, what I do, stack ticker, featured gallery, case studies, testimonials, about, focus, CTA, footer |
| `archive.html` | Filterable grid of everything, with a lightbox |
| `nova.html`, `aria.html`, `cadence.html`, `fitloop.html`, `brew.html`, `vision.html` | Six case-study pages sharing one template |

## Files

```
index.html · archive.html · <project>.html
assets/css/styles.css     all styling (18 numbered sections)
assets/js/main.js         all behaviour (16 numbered modules)
assets/fonts/             self-hosted Inter Tight + JetBrains Mono (variable woff2)
assets/img/               project shots (webp), placeholder art, favicon
```

## Make it yours

1. **Your photo (important)**
   Add your image as `assets/img/harsh.jpg`. Until that file exists the site shows a
   labelled placeholder (`assets/img/harsh-placeholder.svg`). It is used in the hero
   (full-bleed, shown greyscale) and in the About section — a portrait or a photo of you
   at a laptop is ideal. `.png`/`.webp` also work: change the `src` in `index.html` (2 places).

2. **Email + phone**
   Find & replace `hello@harsh.dev` and `+91 98765 43210` across the HTML files.
   The `data-copy` button copies whatever is in its attribute, so update that too.

3. **Social links**
   The footer "Follow" column points at `github.com`, `linkedin.com`, `x.com` and
   `instagram.com` — swap in your real profile URLs.

4. **Résumé**
   In `index.html` the `Download résumé` button is `<a href="#" download>`. Point it at
   a PDF (e.g. `assets/harsh-resume.pdf`) and drop that file into `assets/`.

5. **Projects**
   - Gallery cards (home): copy one `<article class="pcard">` block in `#featured`.
   - Case-study list: copy one `<li class="case">` block in `.cases__list`.
   - Archive: copy one `<figure class="tile">` block. `data-cat` accepts `websites`,
     `apps`, `ai` (space-separate for multiple); `data-title` is the lightbox caption.
   - Each card links to a case-study page — edit the `href` to point at your own.

6. **Words**
   Statements, testimonials, timeline copy and the case-study text are all plain HTML.
   Replace the three sample testimonials with real ones before you publish.

7. **Colours**
   Open `assets/css/styles.css` → section `01. TOKENS`. Everything derives from a handful
   of variables: `--bg`, `--cream`, `--ink`, `--muted`, `--line`.

## What is in the build

- **Preloader** with a counting percentage, then a staggered hero entrance
- **Pinned horizontal gallery** — the section pins and cards travel sideways as you scroll
  (falls back to a native swipeable scroller under 980px and with reduced motion on)
- **Scroll-lit headlines** — word-by-word colour reveal tied to scroll position
- **Hero parallax** on the portrait, scroll-linked marquee, infinite tool tickers
- **Case-study hover previews** that follow the cursor
- **Testimonials** over outlined giant type that drifts with the scroll
- **Custom cursor** (fine pointers only), film-grain overlay, floating dock with scrollspy
- Custom scrollbar, focus-visible styles, `prefers-reduced-motion` support, mobile menu
- Archive filters + keyboard-accessible lightbox, copy-to-clipboard email

## Performance notes

Project shots are optimised `.webp` (~20–70 KB each). Fonts are subset variable `.woff2`
files served from your own domain — no third-party requests at all. If you add large
images, run them through any WebP/AVIF converter first.

## Licence / credits

Fonts: Inter Tight and JetBrains Mono, both under the SIL Open Font License 1.1
(licence files ship inside the font packages). Code is yours to use and modify.
