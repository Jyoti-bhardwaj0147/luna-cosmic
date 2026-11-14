# Deterministic maintenance

The workflow retains its existing filename, `.github/workflows/ai-maintenance.yml`,
but uses no AI service, API credentials, model, or local language model. Existing
AI service secrets are not used or deleted. API cost is zero; GitHub-hosted runner
minutes remain subject to your GitHub plan and usage allowance.

## Schedule and execution

- Monday through Saturday at 05:41 UTC / 11:11 AM Asia/Kolkata.
- Cron: `41 5 * * 1-6`; no Sunday schedule. GitHub schedules may run late.
- Manual runs use Actions -> Deterministic Maintenance -> Run workflow, on the
  default branch. Only the default branch is eligible.
- Node comes from the tracked root `.nvmrc` (24). `npm ci --ignore-scripts`
  installs the committed lockfile without dependency lifecycle scripts.
- Existing full-SHA-pinned checkout, setup-node and setup-python actions are
  retained. Credentials are not persisted by checkout. Job timeout is 25 minutes;
  concurrency serializes runs per branch.

## Allowed work

`python scripts/maintenance_agent.py` requires a clean Git checkout. It runs the
full validation gate before touching files. It then computes, in memory:

1. Existing ESLint **layout-only** autofixes for tracked `src` JavaScript and
   TypeScript files. Problem, suggestion and directive fixes are excluded.
2. Formatting through the exact locked Prettier version and `.prettierrc.json`.
   Formatting must reach a stable fixed point with ESLint. No plugins, downloads,
   dependency upgrades, logic rewrites, or CSS transformations are performed.
3. `docs/generated-pages.md`, a sorted inventory of tracked App Router page
   filenames. It is rewritten only when its derived content differs. This is a
   source inventory, not a claim about expanded dynamic URLs.

At most two files and 180 added/deleted lines are applied per run. Files over
100 KB and transformations that exceed the remaining diff budget are skipped
and reported. The generated inventory is considered first, then source paths in
sorted order. Existing format debt may therefore be resolved over several runs;
large files needing broad formatting require a deliberate manual change.

Only tracked `.ts`, `.tsx`, `.js`, `.jsx` files under `src/` and the one generated
inventory are writable. Symlinks, deletions, executable-mode changes, hidden paths,
workflows, manifests, locks, configuration, maintenance scripts/tests, assets and
build outputs cannot be included. No timestamps or artificial activity commits
are generated. Formatting differences are legitimate changes under this policy.

## Validation and commit safety

The sequential gate runs Python maintenance tests, ESLint, Next type generation
and TypeScript, Vitest, and a production build. Existing Next ESLint rules include
static accessibility checks for alt text and ARIA properties/roles. Those checks
remain at their existing severities; they are not a full accessibility audit.
Ambiguous accessibility changes are never autofixed.

After transformations the same gate runs again. Unexpected paths, content drift,
file modes and oversized diffs fail closed. A successful run saves exact content
hashes and the baseline commit in `.git/luna-maintenance.json`. This local receipt
is never committed. `scripts/check_staged.py --stage` stages only these files and
checks the actual index against the receipt immediately before committing. Failed
runs produce no receipt/handoff; edits are left for inspection rather than reset.
No-change runs succeed with a clean working tree and do not create a commit.

The maintenance job alone has `contents: write`. The push token is provided only
to the final commit/push step. Author and committer are `Jyoti-bhardwaj0147`, using
the repository Actions secret `MAINTENANCE_AUTHOR_EMAIL`. Set this secret under
Settings -> Secrets and variables -> Actions to an email associated with that
GitHub account, or copy the exact GitHub-provided noreply address from the
account's Settings -> Emails. A missing secret stops commits instead of falling
back to bot attribution. This applies to scheduled runs and manual `commit` runs;
`preview` does not commit. Manual `approved` mode still requires the owner and
the exact validated preview token. Existing commits are not rewritten.

GitHub contribution credit requires an associated email and commits on the
default branch (this workflow targets `main`); updates can take up to 24 hours.
The push still authenticates through `GITHUB_TOKEN`, so Actions can remain visible
as the pushing application even though commit metadata identifies the owner.
There is no force push,
PAT, branch-protection bypass, or manual PR approval. If branch protection blocks
direct bot pushes, the run fails; repository policy must allow this workflow for
unattended direct commits to work.

## Deployment and CI limitations

This checkout contains no separate deployment or push-triggered CI workflow.
GitHub documents that a push made with `GITHUB_TOKEN` does **not** start other
push-triggered Actions workflows. The full checks therefore run inside this job.
External hosting integrations may handle bot commits differently; their remote
settings have not been verified. This workflow does not deploy or dispatch other
workflows automatically.

Reference: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow

## Local review

Run `npm run validate:maintenance` to check the current work without applying
maintenance. To run the automation, first commit legitimate local edits, then run
`python scripts/maintenance_agent.py`. It may modify allowlisted files, but does
not stage, commit, or push locally. Review the diff yourself. Do not run the staged
checker manually unless you intend to stage the validated maintenance result.
