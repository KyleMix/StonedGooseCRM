# Branding assets — Stoned Goose Productions

Brand assets used by the CRM and adjacent services. Committed to git so
a fresh clone has everything needed to set up a new workspace.

## Files

| File | Used for |
|---|---|
| `logo.png` | Twenty workspace logo (Settings → Workspace → upload) |
| `logo-square.png` | Square variant for favicons / app icons (if different from `logo.png`) |
| `favicon.ico` | Browser tab icon (when deployed publicly — see `docs/mobile-access.md`) |

## Sizes

- **Twenty workspace logo**: recommended 256×256 or larger, PNG with
  transparent background. Twenty downscales as needed for the sidebar
  and top bar.
- **Favicon**: 32×32 minimum, ideally a multi-resolution `.ico`.

## Uploading the logo to Twenty

1. Open <http://localhost:3000>, sign in.
2. Settings → Workspace → General.
3. Click the logo placeholder and upload `branding/logo.png`.
4. Save.

The logo will appear in the sidebar and on the workspace switcher.

## Source files (optional)

If you have layered source files (`.ai`, `.psd`, `.svg`), commit them
to this directory too so future edits don't require re-creation. Keep
binaries small — if a source file exceeds ~5 MB, store it elsewhere
and link from this README.
