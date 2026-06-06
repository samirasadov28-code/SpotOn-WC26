# SpotOn WC26 — Claude Instructions

## Git Workflow

After completing any task or set of changes:
1. Commit all changes to the feature branch (`claude/eager-bohr-CaIuc`)
2. **Always merge the feature branch into `main` and push `main` to origin** so Netlify picks up the changes:
   ```
   git checkout main
   git merge claude/eager-bohr-CaIuc --no-edit
   git push origin main
   git checkout claude/eager-bohr-CaIuc
   ```
