# Security Policy

rQrcode is a local-first desktop and CLI application. QR payloads and image files supplied by a user may contain sensitive information and should not be included in public issues, pull requests, screenshots, or fixtures.

Do not commit tokens, passwords, private keys, personal data, or private service configuration. If a secret is exposed, revoke or rotate it first, then report the incident privately through GitHub's **Security > Report a vulnerability** flow. Include the affected commit or version, reproduction conditions, and impact without publishing exploitable details.

The `0.1.x` line is a development preview. Release packages may be unsigned or unnotarized; see [RELEASE.md](RELEASE.md).
