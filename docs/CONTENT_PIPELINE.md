# Content pipeline — Albert

How a book gets from a raw source (Sefaria reference list, Bereshit Press
EPUB, or your own Markdown) into the reader on a user's phone.

```
                                                                          
  source                                                                  
  ┌──────────────────┐                                                    
  │ Sefaria YAML     │                                                    
  │ EPUB + book.yaml │  ── build-book ──>  books-out/<id>.book.json       
  │ Markdown + matter│         (validates against BookDocument)           
  └──────────────────┘                                                    
                                  │                                       
                                  ▼                                       
                          validate-book                                   
                                  │                                       
                                  ▼                                       
                          upload-book --publish                           
                                  │                                       
                ┌─────────────────┴─────────────────┐                     
                ▼                                   ▼                     
        books table (Postgres)        Storage: books/<id>/<ch>.json       
                │                                   │                     
                └─────────────── reader ────────────┘                     
                                  │                                       
                          memory cache → CDN fetch → Sefaria              
                          fallback (services/bookStorageService.ts)       
                                                                          
```

---

## Prerequisites

- Node 20+ and the repo dependencies installed (`npm install` in the repo
  root).
- For uploads, two shell env vars:
  ```bash
  export SUPABASE_URL=https://hctuqfkhcqzmyrkctwlt.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=eyJ...              # never commit
  ```
  The service role key lives in Supabase Dashboard → Settings → API →
  `service_role`. It bypasses RLS so we can upsert into `books` and
  `chapters` directly.

---

## Adding a Sefaria book (sefaria mode)

Use this when the text already lives in Sefaria and you only need to pin
chapter refs.

1. Write a YAML config — see [`examples/pirkei-avos.sefaria.yaml`](../examples/pirkei-avos.sefaria.yaml).
   Required top-level fields: `id`, `title`, `category`, `layoutMode`,
   `language`, `ageGroup`, `requiresSub`, `chapters[]`. Each chapter has at
   minimum `title` and `sefariaRef`.

2. Build:
   ```bash
   npm run build-book -- --mode sefaria --input examples/pirkei-avos.sefaria.yaml
   ```
   Output: `books-out/pirkei-avos.book.json`. Each chapter has
   `sections: []` — the reader's `sefariaService` materializes them at
   runtime from the canonical reference.

3. Upload:
   ```bash
   npm run upload-book -- books-out/pirkei-avos.book.json --publish
   ```
   `--publish` flips `is_published = true` on the `books` row. Omit it to
   stage a draft.

4. Open the app — the book appears in the library and the reader pulls
   text from Sefaria the first time you tap a chapter.

---

## Adding a Bereshit Press EPUB (epub mode)

Albert's reader was designed around Albert Gindi's Bereshit Press
typography brief. EPUB ingestion preserves that fidelity by mapping
class-tagged blocks straight into `BookSection` kinds.

1. Place the EPUB and a sibling `book.yaml` somewhere convenient. The
   `book.yaml` carries metadata that the EPUB doesn't (id, category,
   layoutMode, gradient, etc.); chapters are derived from the OPF spine.

   ```yaml
   # book.yaml
   id:           sukkah-shel-emunah
   title:        Sukkah Shel Emunah
   hebrewTitle:  סוכה של אמונה
   category:     chasidus
   layoutMode:   side-by-side
   language:     bilingual
   ageGroup:     adult
   requiresSub:  true
   authors:
     - name:   Albert Gindi
       hebrew: אַלְבֶּרְט גִּינדִי
   tags: [Chasidus, Original]
   coverGradient: ["#4A1840", "#2A0A28"]
   coverAccent:   "#E8C547"
   ```

2. **CSS class conventions** (these must appear on the EPUB's XHTML
   elements for the converter to recognise them):

   | Class            | Maps to BookSection.type | Notes |
   |------------------|--------------------------|---|
   | `mishnah`        | `mishnah`                | Optional `data-verse="1:3"` for verse ref |
   | `gemara`         | `gemara`                 | |
   | `rashi`          | `rashi`                  | |
   | `tosfos`         | `tosfos`                 | |
   | `mefaresh`       | `mefaresh`               | **Requires** `data-speaker="RAMBAM"` (or similar) |
   | `pasuk`          | `pasuk`                  | Optional `data-verse="1:3"` |
   | `perek-open`     | `perek-open`             | |
   | `parsha-marker`  | `parsha-marker`          | |
   | `aliyah`         | `aliyah`                 | |
   | `divider`        | `divider`                | `<hr>` also works |

   Untagged paragraphs with `dir="rtl"` (or majority-Hebrew text) become
   `hebrew`; the rest become `english`. `<h1>/<h2>/<h3>` become `heading`
   blocks. Chapter titles are pulled from the first heading in each spine
   item.

3. Build:
   ```bash
   npm run build-book -- --mode epub --input /path/to/book.epub
   # or, if already unzipped:
   npm run build-book -- --mode epub --input /path/to/unzipped-book/
   ```
   On Windows the converter uses `Expand-Archive`; on macOS/Linux it uses
   `unzip`.

4. Validate + upload as for sefaria mode.

**Troubleshooting:**
- *"No chapters extracted from EPUB"* — usually means the spine items
  contain only `<img>` / cover content, or every XHTML body is empty.
  Inspect the OPF and the XHTML files directly.
- *Mefaresh blocks lose attribution* — the `data-speaker` attribute is
  required; the converter falls back to "Commentator" if missing.
- *Hebrew renders as English* — the paragraph isn't tagged with `dir="rtl"`
  AND the majority-Hebrew heuristic didn't trigger (typical for mixed
  English-Hebrew commentary). Add `dir="rtl"` to the wrapping element or
  tag it with a known class.

---

## Adding a Markdown book (markdown mode)

For original writing or quick prototypes.

```markdown
---
id:          my-book
title:       My First Book
hebrewTitle: ספרי הראשון
category:    mussar
layoutMode:  side-by-side
language:    bilingual
ageGroup:    all
requiresSub: false
authors:
  - name: Author Name
tags: [Original]
---

# Opening Chapter

## A section heading

A regular paragraph becomes `english` (or `hebrew` if the script majority
is Hebrew).

```hebrew
שָׁלוֹם
```

```mishnah
The body of a mishnah block.
```

```mefaresh:RAMBAM
A commentator block — the suffix after `:` becomes `speaker`.
```

```pasuk:1:3
The pasuk content, with verse ref { chapter: 1, verse: 3 }.
```

---

A bare `---` on its own line becomes a divider.

---chapter---

# Second Chapter

…and so on. Every `---chapter---` separator starts a new BookChapter.
```

**Supported code fences:**

| Fence                  | Section type |
|------------------------|--------------|
| ` ```mishnah `         | `mishnah`    |
| ` ```gemara `          | `gemara`     |
| ` ```rashi `           | `rashi`      |
| ` ```tosfos `          | `tosfos`     |
| ` ```hebrew `          | `hebrew`     |
| ` ```mefaresh:SPEAKER ` | `mefaresh` (speaker = whatever follows `:`) |
| ` ```pasuk:CH:V `      | `pasuk` (verse = { chapter, verse }) |
| anything else          | `english`    |

Build / validate / upload as for the other modes.

---

## Updating an existing book

`upload-book.ts` upserts. Re-running it on the same `id` overwrites the
`books` row and re-uploads every chapter to Storage. The reader caches
chapter JSON for 7 days via `services/bookStorageService.ts`; either:

- bump the version in your `book.yaml` and re-publish, then call
  `invalidateChapterCache(bookId)` from the admin tools, or
- wait for the TTL to expire.

---

## Unpublishing

```sql
UPDATE books SET is_published = false WHERE id = '<id>';
```

The book disappears from the public library. Existing downloads remain on
device.

---

## Deleting

```sql
-- 1. Remove chapters first (FK reference)
DELETE FROM chapters WHERE book_id = '<id>';
-- 2. Remove the book row
DELETE FROM books WHERE id = '<id>';
```

Then delete the storage folder via the Supabase dashboard or the storage
API: `books/<id>/`. The reader handles missing chapters gracefully.

---

## Common errors and fixes

- **Validation: `Missing or empty required field: "category"`** — your
  YAML / frontmatter is missing a top-level field. Check the
  [BookDocument schema](../constants/BookSchema.ts).
- **Validation: `chapters[i].sections[j] (type=mefaresh) requires a
  'speaker' field`** — every `mefaresh` block must carry a speaker; in
  Markdown that's the `:SPEAKER` suffix on the fence, in EPUB it's
  `data-speaker`.
- **Upload: `Storage upload failed: ... RLS`** — you used the anon key
  instead of the service role key. Re-export `SUPABASE_SERVICE_ROLE_KEY`.
- **Upload: `books upsert: column ... does not exist`** — migrations
  haven't been applied. Run `npx supabase db push --linked` and
  `npm run verify-schema`.

---

## Roadmap

- PDF input (single-column scholarly PDFs → OCR → markdown pipeline)
- Word `.docx` input
- Batch folder ingest (`build-book --batch ./inbox/`)
- Web-based editor inside the admin panel for in-place chapter edits
