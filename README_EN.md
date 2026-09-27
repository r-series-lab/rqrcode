# rQrcode

rQrcode is a lightweight local QR code tool for generating, decoding, copying, and exporting QR codes. It also provides stable JSON commands for scripts and AI agents.

## Highlights

- Generate a QR code from text or a link and export PNG.
- Decode a QR code from a selected image, dragged file, or pasted screenshot.
- Copy decoded content and ask before opening links.
- Keep the most recent ten items locally, with delete and clear-all actions.
- Use `info`, `capabilities`, `encode`, and `decode` with `--json`.

## Safe sample data

The public screenshot uses `https://example.test/demo` and `Demo Text`. Do not publish real contacts, account links, private tokens, or personal QR content.

## CLI

```sh
cargo run --manifest-path ./src-tauri/Cargo.toml -- info --json
cargo run --manifest-path ./src-tauri/Cargo.toml -- encode --text "https://example.test/demo" --out /tmp/demo-qr.png --json
cargo run --manifest-path ./src-tauri/Cargo.toml -- decode --input /tmp/demo-qr.png --json
```

The CLI reads and writes only the paths supplied by the user.

## Development

```sh
npm run web:build
npm run rust-check
npm run rust-test
```
