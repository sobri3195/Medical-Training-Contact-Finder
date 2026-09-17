# Medical Training Contact Finder

A production-oriented, frontend-only workspace for organizing professional contact information explicitly published by medical training institutions. Built with Vite, React, TypeScript, Tailwind CSS, and IndexedDB.

## Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Other commands:

```bash
npm test
npm run build
```

## Usage

1. Enter the institution, training program, specialty, and country that define the research scope.
2. Supply up to 25 specific official URLs, or select an authorized HTML/CSV file. Confirm the authorization statement before processing.
3. Review the status shown for every source. Failed browser requests explain the CORS limitation and point to file import.
4. Inspect extracted evidence and source attribution. Correct the transparent local classification and manually approve eligible records.
5. Export approved records as CSV or JSON. Delete individual records, mark an address **Do Not Contact**, or clear all local data at any time.

The CSV importer supports: `full_name`, `role`, `specialty`, `training_program`, `institution`, `country`, `professional_email`, `profile_url`, `source_url`, and `notes`.

## Browser-only limitations

The browser can fetch an external institutional page only if that site allows cross-origin requests (CORS). Many sites do not. This application does not use a public proxy, backend, headless browser, or workaround. A failed fetch is marked **Blocked by CORS**; download a page you are authorized to process and import its HTML, import CSV, or enter a record manually instead. The app never discovers links or crawls a domain.

Extraction is intentionally conservative. It uses `DOMParser`, removes scripts, styles, navigation, footers, and hidden regions, and collects only visible email text and ordinary `mailto:` values. It does not infer names from surrounding prose, guess addresses, decode concealed values, authenticate, or assess whether a site's terms permit a particular use. Users remain responsible for authorization, robots.txt, applicable law, institutional policy, and appropriate communication.

## Local data and classification

Contact records are stored in IndexedDB. The suppression list is a lightweight preference in localStorage. Nothing is sent to analytics or an external API. Classification is deterministic and editable:

- syntactically invalid → **Invalid email**
- known free-mail domain → **Free-email address requiring review**
- generic local part such as `program` or `residency` → **Generic program contact**
- other valid address → **Institutional professional email**
- repeated normalized address → **Duplicate**, preserving source URLs
- user suppression → **Do Not Contact**, which also prevents re-import

Because there is no server, data is limited to this browser profile and can be lost when site data is cleared. Export approved data if you need a backup.

## Privacy and anti-abuse checklist

- [x] Requires an explicit authorization confirmation before processing.
- [x] Accepts only user-supplied URLs (25 maximum); performs no search, discovery, or recursive crawling.
- [x] Uses direct CORS-permitted browser fetches only; no proxy, bypass, CAPTCHA solving, authentication, or anti-bot evasion.
- [x] Offers authorized HTML/CSV import and manual entry when CORS prevents retrieval.
- [x] Extracts only explicitly present addresses and never guesses institutional patterns.
- [x] Removes scripts, navigation, hidden content, and footers before visible-text extraction.
- [x] Flags generic and free-mail addresses; free-mail results require review.
- [x] Records source attribution, collection time, evidence, and extraction method.
- [x] Normalizes and deduplicates addresses while preserving all source URLs.
- [x] Stores contacts locally in IndexedDB and sends no data to analytics or APIs.
- [x] Provides record deletion, clear-all, and persistent Do Not Contact suppression.
- [x] Exports only manually approved, valid, non-suppressed records by default.
- [x] Contains no bulk sending, sequences, tracking pixels, outreach automation, patient data tooling, or people-search enrichment.
- [x] Includes only clearly fictional demonstration names, domains, and institutions.

## Project structure

```text
src/
  components/       Reusable dashboard, modal, table, and error UI
  storage/db.ts     IndexedDB persistence
  utils/email.ts    Extraction, validation, normalization, classification, deduplication
  utils/csv.ts      CSV parsing and export
  App.tsx           Dashboard state and workflows
  types.ts          Shared domain types
```
