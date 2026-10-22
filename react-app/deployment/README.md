# React Pages release checklist — Phase 5B

Prepared on 2026-10-22 for `feature/react-migration` and draft PR #2.
This supersedes the Phase 5A template-only activation plan. The deployable workflow
is now `.github/workflows/deploy-react-pages.yml`; the adjacent
`github-pages.yml.template` is an inactive reference copy, not another workflow.

**Do not merge, change Pages settings, or deploy as part of preparation.**
The operator must explicitly set `REACT_PAGES_DEPLOY_ENABLED=false` before merging.

## Current production and review status

- Pages source, confirmed by the owner: Deploy from a branch → main → /(root).
- Known-good static baseline: `dee83688965fcb76b7f25a4bf074029357ee2cb1`.
- Last verified static deployment:
  https://github.com/udeenc/portfolio/actions/runs/39671398843
- Root index.html, css/, js/, assets/ and third-party notices remain unchanged.
- Migration checkpoint: `d4e297eb47acbf636a463715c34697eac49cba55`.
- PR #2 remains draft; no auto-merge:
  https://github.com/udeenc/portfolio/pull/2
- Owner-provided manual browser review is APPROVED. See [BROWSER-SIGNOFF.md](BROWSER-SIGNOFF.md).
  Prior reports' browser-pending notes describe the earlier audit state.
- Phase 4.5 push and PR Ubuntu/Node 24 validation runs passed. Phase 5B changes
  must also pass the existing validation-only PR/push workflow before merge.

## Workflow behavior and safety

Triggers: pushes to main and workflow_dispatch. Both jobs require the main ref;
manual selection of a feature branch skips validation/publishing in this workflow.
The separate react-migration-ci.yml continues to validate migration pushes/PRs.

The build job uses Ubuntu and Node 24, npm ci, lint, the complete test suite, and
Vite production build from react-app/. Validation does not depend on the publish
variable. The artifact-upload step and the entire deploy job each additionally
require all of:

- github.repository == 'udeenc/portfolio'
- github.ref == 'refs/heads/main'
- event is push or workflow_dispatch
- vars.REACT_PAGES_DEPLOY_ENABLED == 'true'

An absent variable resolves to an empty value; absent, empty and `false` disable
both upload and deployment. Use the documented lowercase `true`/`false` values.
The guard tests evaluate the actual workflow expressions for these cases. Upload
and deploy also retain GitHub's default success gating; deploy needs a successful
build, and failed lint/tests/build/upload cannot proceed to deployment.

Only react-app/dist is uploaded by the official Pages artifact action. The build
job has contents: read; only deploy receives pages: write and id-token: write.
Deploy uses the github-pages environment. configure-pages has enablement: false;
it does not change the Pages source. Official actions are pinned to reviewed SHAs.
Concurrency group pages, cancel-in-progress: false, serializes this workflow's
production runs; wait for the platform-generated legacy publisher separately.
There is no PR deployment, force push, committed dist, or repository-root upload.

Changing a repository variable is not a workflow trigger. Manual dispatch becomes
available after this workflow exists on the default branch. A feature-branch push
of this preparation does not trigger the production workflow.

## Environment protection inspected — no remote changes made

Public read-only API inspection of environments/github-pages on 2026-10-22 found:

- deployment_branch_policy.custom_branch_policies: true
- deployment_branch_policy.protected_branches: false
- one allowed deployment branch: main (type branch)
- protection_rules contains a branch_policy; no required-reviewer or wait-timer
  rule was listed in that response.

The main-only workflow is compatible with that branch policy. Before merging,
verify these settings in the UI because policies may change or additional rules
may apply. If deployment waits for a reviewer, approve only the reviewed main run;
if a branch-policy error occurs, inspect the selected ref rather than removing
protections. A reviewer gate may be added by the owner as a separate approved
settings change. No environment policy or repository variable was modified here.

## Mandatory GitHub settings BEFORE merge

1. Open https://github.com/udeenc/portfolio/settings/variables/actions.
2. Under **Settings → Secrets and variables → Actions → Variables → Repository
   variables**, choose **New repository variable** (or edit the existing one).
3. Name: `REACT_PAGES_DEPLOY_ENABLED`. Value: `false`. Save/Add variable.
4. Verify the repository-variable row shows that exact name and value `false`.
   Do not use an environment-only variable or a secret for this job-level gate.
   Resolve any organization/environment variable of the same name rather than
   relying on ambiguous configuration. Record the operator confirmation in review.
5. In **Settings → Environments → github-pages**, verify the main branch is allowed,
   review any required-reviewer/wait/custom-protection rules and have the required
   approver available. Do not weaken protections merely to bypass a blocked job.
6. Keep **Settings → Pages → Build and deployment → Source** at **Deploy from a
   branch**, branch **main**, folder **/(root)** through the disabled main build.
7. Keep PR #2 draft and auto-merge off until CI and these release requirements are
   verified. Merge requires explicit authorization; browser signoff alone is not
   merge/deployment approval. Do not merge while the variable's value is unverified.

The current remote variable value has not been verified. That operator confirmation
is a remaining pre-merge requirement; preparation deliberately does not set it.

## Exact post-merge controlled cutover — requires separate authorization

1. Immediately before the approved merge, record Pages Source/branch/folder,
   domain/HTTPS settings, live-site health, and deployed SHA/run. Preserve an
   off-repository git archive of the static baseline paths index.html, css/, js/,
   assets/ if desired. Do not depend on old Actions artifacts still existing.
   Freeze unrelated main pushes through the cutover/verification window.
2. With the repository variable confirmed `false`, perform the explicitly approved
   merge. In **Actions → Deploy React portfolio to GitHub Pages**, inspect the new
   **push / main** run: Install locked dependencies, Lint, Run complete test suite,
   Build production assets must all succeed; **Upload only the React production
   build** and **Publish reviewed React build** must be **skipped**. The build job
   must finish successfully. Stop if upload/deploy is not skipped.
3. Wait for the separate generated pages build and deployment run to complete and
   verify the unchanged static root site is still healthy. Do not let legacy and
   React publishers overlap. Record the validated main SHA.
4. At the approved cutover time, open **Settings → Pages → Build and deployment**.
   Change **Source** from **Deploy from a branch** to **GitHub Actions**. Do not
   choose a new branch/folder, delete/unpublish Pages, or change domain/HTTPS.
   Skip GitHub's starter-workflow suggestion because the reviewed workflow exists.
5. In **Settings → Secrets and variables → Actions → Variables → Repository
   variables**, edit `REACT_PAGES_DEPLOY_ENABLED` from `false` to `true` and save.
   This change does not start a workflow. Prevent unrelated main pushes now:
   enabled publishing also applies to future main pushes.
6. Open **Actions → Deploy React portfolio to GitHub Pages → Run workflow**.
   In **Use workflow from**, select **Branch: main**, then click **Run workflow**.
   Confirm the run event is workflow_dispatch, the ref is main, and its SHA is the
   reviewed revision from step 3. Do not select feature/react-migration or rerun a
   PR check. Approve the github-pages environment request if protection requires it.
7. Monitor validation, the single dist artifact upload, configure-pages, and deploy
   until success. Confirm the reported URL is https://udeenc.github.io/portfolio/.
   Verify live HTML uses hashed /portfolio/assets/ resources rather than legacy
   css/style.css/global script tags. Check initial load, refresh at #about and
   #project-details, screenshots, fonts, licenses, console and approved interactions.
8. Retain legacy source and licenses until the new public deployment is signed off.
   Record the workflow run/SHA and outcome. Keep appropriate environment protection;
   while the flag remains true, future main pushes can release to production.

A merge alone does not change the Pages Source selector. Branch-based publishing
builds the root site, not Vite. An active Pages action can also be permitted to
publish from the existing source branch, so branch mode is not a sufficient kill
switch: explicitly keep the variable false until after the source transition.
Generated publishing and custom artifact publishing can race unless sequenced.

Prevalidation and a prepared operator reduce the transition window, but zero
downtime and instant cache updates are not guaranteed. Keep the old source intact,
monitor the public URL, and roll back if the new release is unhealthy.

## Rollback — restore the static site and its publishing configuration

1. Set the repository variable `REACT_PAGES_DEPLOY_ENABLED=false` and save. This
   prevents new publishing steps/jobs; it does not stop a job already running.
2. Freeze main pushes and cancel or wait for in-progress/queued production runs.
   Disable the React Pages workflow in Actions as an additional safeguard until
   remediation is approved. Ensure no late React job can overwrite rollback.
3. In **Settings → Pages → Build and deployment → Source**, choose **Deploy from a
   branch**, select **main**, select **/(root)**, then **Save**. Preserve the site's
   URL and recorded domain/HTTPS settings; do not delete the Pages site.
4. Verify legacy index.html, css/, js/, assets/ still match baseline
   `dee83688965fcb76b7f25a4bf074029357ee2cb1`. If changed later, restore only those
   paths in a new reviewed fix commit. Never force-push or reset main history;
   React migration code and licenses remain in the repository.
5. Verify a generated **pages build and deployment** run is scheduled and succeeds.
   If necessary and available, rerun a known-good generated run. If saving the
   source does not trigger a build, use an explicitly approved docs-only main push
   to trigger legacy publishing while the React workflow stays disabled/flag false.
6. Check the public HTML is the original static site, then verify CSS, scripts,
   screenshots, anchors, Orb/animations, desktop/mobile behavior, console and HTTPS.
   Account for CDN/browser cache delay. Keep the flag false and workflow disabled
   until a new release is approved. A selector change alone is not verified recovery.

## Validation and remaining release gates

- Local build and lint pass; all 14 tests pass (11 original plus 3 workflow tests).
- actionlint 1.7.12 validates both executable workflows without errors. The tool
  was downloaded from rhysd/actionlint's official release and checked against its
  published SHA-256; it stays in ignored .cache/ and is not a project dependency.
- Workflow tests cover unset/empty/false flags, enabled main push/manual dispatch,
  disallowed refs/events/fork repositories, protected artifact path, permissions,
  environment, build dependency and SHA-pinned actions.
- Vite base remains /portfolio/; local production HTML/resources and license copies
  pass HTTP/path checks. Original source/copy/assets/licenses are unchanged.
- Owner browser signoff is recorded; no new independent browser test was performed.
- The production job has not run and will not be dispatched during preparation.
  Main post-merge disabled-run verification and real Pages/OIDC/public-site checks
  are deliberately deferred to the authorized release.
- Remote repository variable false confirmation, final CI/release review, and
  explicit merge/settings/deployment authorization remain required. Leave PR draft.

## References

- Source settings:
  https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Manual workflow dispatch, default-branch requirement, and main selection:
  https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
- Unset vars context:
  https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- Official deploy action permissions/environment:
  https://github.com/actions/deploy-pages/tree/v5

Stop after Phase 5B preparation. Do not merge, enable publishing, or deploy.
