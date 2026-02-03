# MergeConfigs

Small CLI and library to merge one base JSON file with one or more override JSON files. The merged result is written to `mergedOutput.json` by default.

## Features

✨ **New in v2.0.0**: Automatic merge statistics showing:

- Total keys in base file
- Properties merged per override file
- Total properties merged
- Properties unchanged from base

## Requirements

- Node.js 14+

## Installation

```bash
npm install
```

## CLI Usage

From the project root:

```bash
node src/index.js <base.json> <override1.json> [override2.json ...] [options]
```

### Options

- `--output, -o <file>` - Specify custom output file path (default: `mergedOutput.json`)
- `--help, -h` - Show help message

### Examples

```bash
# Default output to mergedOutput.json
node src/index.js base.json file1000.json file2000.json

# Custom output file
node src/index.js base.json file1000.json file2000.json -o result.json

# Using --output flag
node src/index.js base.json override1.json override2.json --output custom.json
```

Example (Windows PowerShell / CMD):

```powershell
node src\index.js configs\base.json configs\override.prod.json -o final.json
```

### Example Output

```
==================================================
MERGE STATISTICS
==================================================

Base file: base.json
  Total keys: 6

Override files:
  file1000.json: 2 properties merged
  file2000.json: 2 properties merged

Total properties merged: 4
Properties unchanged from base: 2
==================================================

✓ Configs merged successfully -> mergedOutput.json
```

Exit codes:

- 0 — success
- 1 — runtime error
- 2 — missing files / invalid usage

## Programmatic API

Require and call the merge function from code:

```javascript
const { mergeConfigs } = require("./src/function");

(async () => {
	const merged = await mergeConfigs("path/to/base.json", ["path/to/override1.json", "path/to/override2.json"], {
		write: true,
		outputPath: "custom-output.json",
		showStats: true, // Set to false to disable statistics
	});
	console.log(merged);
})();
```

### Options

- `write` (boolean, default: `true`) - Whether to write the output file
- `outputPath` (string, default: `'mergedOutput.json'`) - Path for the output file
- `showStats` (boolean, default: `true`) - Whether to display merge statistics

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
	"features": ["a", "b"]
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
