# Contributing

Keep safety boundaries intact:
- no direct game install
- no `.rpf` editing
- no original file writes
- no automatic mass patching

Run before submitting:
```powershell
npm run typecheck
npm run build
npm run test
cd src-tauri
cargo check
cargo test
```
