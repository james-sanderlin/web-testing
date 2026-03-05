---
name: add-download
description: Add a new downloadable file to the Download page. Use when the user wants to add a download, add a file to downloads, add a new file card, or make a file available for download.
argument-hint: [filename]
---

# Add a Download File

You are adding a new downloadable file card to the Download page in Browser Test Lab. Follow these steps exactly.

If the user provided a filename as an argument, use it: `$ARGUMENTS`
Otherwise, ask the user for the filename and any details (display name, description).

## Step 1: Place the asset file

The file must exist in the `assets/` directory at the project root. This is where the API serves files from.

- If the user provides a file, copy/move it to `assets/<filename>`
- If the file already exists in `assets/`, confirm its name
- Note the file extension and size for the card metadata

## Step 2: Register the MIME type (if needed)

Check `api/index.js` — the `defaultMimeTypes` object maps extensions to MIME types. If the file's extension is not already listed, add it in alphabetical order by extension.

## Step 3: Add the file card to download.html

Add a new card inside the `#file-grid` div in `public/feature-pages/download.html`. Place it near related file types (group images together, audio together, etc.).

### Card template

```html
  <!-- Short description comment -->
  <div class="file-card" data-filename="FILENAME" data-type="TYPE" data-size="SIZE_CATEGORY">
    <div class="file-content">
      <div class="file-icon"><span class="material-icons">ICON_NAME</span></div>
      <div class="file-info">
        <h3>Display Name <span class="file-meta">EXT &bull; FILE_SIZE</span></h3>
        <p>Short description</p>
      </div>
    </div>
    <button class="download-btn" onclick="downloadViaAPI('EXT_KEY', 'FILENAME')">
      <span class="material-icons">download</span>
      Download
    </button>
  </div>
```

### Field reference

**`data-filename`**: Exact filename in `assets/` (e.g., `sample.png`). Used by search.

**`data-type`**: Category for icon color coding. Must be one of:
| data-type     | Icon color | Use for                        |
|---------------|------------|--------------------------------|
| `text`        | Blue       | .txt, .csv, .json, .xml       |
| `document`    | Blue       | .docx, .doc, .rtf             |
| `image`       | Purple     | .png, .jpg, .gif, .svg, etc.  |
| `video`       | Red        | .mp4, .webm, .mpg, .mov       |
| `audio`       | Orange     | .mp3, .wav, .m4a, .flac, etc. |
| `pdf`         | Red        | .pdf                           |
| `archive`     | Teal       | .zip, .rar, .7z, .tar.gz      |
| `email`       | Amber      | .eml, .msg                     |
| `exe`         | Red        | .exe, .msi, disguised files    |
| `spreadsheet` | Green      | .xlsx, .xlsb, .ods, .csv      |
| `remote`      | Blue-gray  | .rdp, .ica                     |

**`data-size`**: Rough size bucket — `tiny` (<1KB), `small` (<50KB), `medium` (<500KB), `large` (>500KB). Used by search.

**Material Icon**: Choose based on file type:
| Type        | Icon              |
|-------------|-------------------|
| Text        | `description`     |
| Document    | `article`         |
| Image       | `image`           |
| Animated    | `animation`       |
| Video       | `movie`           |
| Audio       | `audiotrack`      |
| PDF         | `picture_as_pdf`  |
| Archive     | `folder_zip`      |
| Email       | `email`           |
| Executable  | `terminal`        |
| Dangerous   | `warning`         |
| Security    | `report`          |
| Spreadsheet | `table_chart`     |
| Remote      | `computer`        |
| Dynamic     | `schedule`        |

**`onclick`**: For static files served from `assets/`, always use:
```js
downloadViaAPI('ext_key', 'exact-filename.ext')
```
The first argument is a short key (e.g., `'png'`, `'mp3'`). The second is the exact filename in `assets/`.

Only use a custom JS function (defined in `download.js`) for dynamically generated files (like the timestamp or canvas-generated image).

### Style rules

- **Title**: Short, concise (e.g., "WAV Audio", "Cat Photo", "Protected ZIP")
- **Meta pill**: Format as `EXT &bull; SIZE` (e.g., `PNG &bull; 150KB`). Use `&bull;` for the dot, `&lt;` for `<`
- **Description**: One short phrase, no period (e.g., "Compressed audio", "Apple HEIC format")
- Do NOT use emoji anywhere — Material Icons only

## Step 4: Verify

After adding the card, confirm:
1. The asset file exists in `assets/`
2. The MIME type is registered in `api/index.js` (if it's a new extension)
3. The `data-type` matches one of the supported types (for icon coloring)
4. The `data-filename` matches the exact filename in `assets/`
5. The card is placed near similar file types in the grid
6. Title and description are concise — no overflow
