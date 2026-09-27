# rQrcode interface guide

The public screenshot uses `https://example.test/demo` and `Demo Text` only. Keep real contacts, account links, tokens, and personal QR content out of screenshots and public issues.

## Generate

Enter sample text or a test link and review the preview. Export to a new PNG path rather than overwriting an existing file until the result is confirmed.

## Decode

Choose an image, drag it into the decode area, or paste a test screenshot. Review the decoded text before copying or opening it. A link should be opened only after an explicit user confirmation.

## History

Recent generated and decoded items stay on the local device. Delete a single item when it is no longer useful, or clear the list after a demonstration.

## CLI

Use `capabilities --json` to discover supported commands. Use `encode --json` for generation and `decode --json` for an explicit input file. Keep output paths and input files within the user-selected scope.
