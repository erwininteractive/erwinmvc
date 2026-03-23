## Release v0.4.2 (unreleased)

### Changes
- feat(auth): Auto-inject authenticated user to views via res.locals #8
- feat(scaffold): Add cookie-parser for JWT cookie authentication #4
- docs: Document user auto-injection feature in README
- test: Fix scaffold package.json to use correct framework version #17

---

## Release v0.4.1

### Changes
- test(auth): Add comprehensive test coverage for Auth module #15

---

## Release v0.4.0

### Changes
- feat(auth): Add WebAuthn (Passkeys) support - passwordless authentication with security keys #14
- feat(cli): Add \`npx erwinmvc webauthn\` command for quick WebAuthn scaffolding
- feat(db): Add \`WebAuthnCredential\` model and \`username\` field to User model
- docs: Update README with WebAuthn documentation

---

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit message guidelines.
