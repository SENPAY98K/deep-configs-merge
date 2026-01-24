# MergeConfigs

Small CLI and library to merge one base JSON file with one or more override JSON files. The merged result is written to `mergedOutput.json` by default.

## Requirements

- Node.js 14+

## CLI Usage

From the project root:

```bash
node src/index.js <base.json> <override1.json> [override2.json ...]
```

Example (Windows PowerShell / CMD):

```powershell
node src\index.js configs\base.json configs\override.prod.json configs\override.local.json
```

Output: `mergedOutput.json` in the current working directory.

Exit codes:
- 0 — success
- 1 — runtime error
- 2 — missing files / invalid usage

## Programmatic API

Require and call the merge function from code:

```javascript
const { mergeConfigs } = require('./src/function');

(async () => {
  const merged = await mergeConfigs(
    'path/to/base.json',
    ['path/to/override1.json', 'path/to/override2.json'],
    { write: true } // outputPath can be provided; default is mergedOutput.json
  );
  console.log(merged);
})();
```

Notes:
- `overrideConfigPaths` accepts a single string or an array of strings.
- Default behavior: `write: true` and output to `mergedOutput.json`.

## Merge semantics

- Plain objects are merged recursively.
- Arrays and non-plain objects (Date, RegExp, etc.) are replaced by the override value.
- Overrides are applied in order; later files take precedence.

## Error handling

- Invalid JSON in any input file throws an error identifying the file.
- CLI reports missing files and exits with code 2.

## Example

`base.json`
```json
{
  "app": { "port": 3000, "name": "app" },
  "features": ["a","b"]
}
```

`override.json`
```json
{
  "app": { "port": 8080 },
  "features": ["c"]
}
```

Result (`mergedOutput.json`)
```json
{
  "app": { "port": 8080, "name": "app" },
  "features": ["c"]
}
```

## Notes

- The CLI always writes to `mergedOutput.json`. To change output path use the `options.outputPath` parameter when calling `mergeConfigs` programmatically.
- Provide paths absolute or relative to the working directory.