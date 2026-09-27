# Contributing

Thank you for helping improve rQrcode. Read the [public repository boundary](PUBLIC_REPOSITORY.md) before opening a pull request.

## Development setup

```bash
npm install
npm run web:build
npm run rust-check
npm run rust-test
```

Keep pull requests focused and update `CHANGELOG.md` when a public behavior or CLI contract changes. Release packaging and tags are maintained according to [RELEASE.md](RELEASE.md).

Never commit QR images containing private content, real credentials, API keys, private paths, or remote service configuration. Use `example.com` and synthetic text for tests and documentation.
