import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../../.github/workflows/deploy-react-pages.yml', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')

// actionlint validates YAML/expression syntax. Evaluate the actual simple boolean
// guards here to exercise unset/false flags and event/ref/repository combinations.
function conditionAfter(marker) {
  const lines = workflow.slice(workflow.indexOf(marker)).split('\n')
  const start = lines.findIndex(line => /^\s+if: >-$/.test(line))
  assert(start >= 0, 'Missing condition after ' + marker)
  const indentation = lines[start].match(/^ */)[0].length
  const expression = []
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && line.match(/^ */)[0].length <= indentation) break
    if (line.trim()) expression.push(line.trim())
  }
  const source = expression.join(' ')
  assert(/^[a-zA-Z0-9_.' /()&|=]+$/.test(source), 'Guard needs an updated evaluator')
  return Function('github', 'vars', 'return (' + source + ')')
}

const build = conditionAfter('  build:')
const upload = conditionAfter('      - name: Upload only the React production build')
const deploy = conditionAfter('  deploy:')
const context = (event = 'push', ref = 'refs/heads/main', repository = 'udeenc/portfolio') => ({
  event_name: event, ref, repository,
})

test('absent and false flags allow main validation but prohibit Pages upload and deployment', () => {
  for (const event of ['push', 'workflow_dispatch']) {
    for (const variables of [{}, { REACT_PAGES_DEPLOY_ENABLED: '' }, { REACT_PAGES_DEPLOY_ENABLED: 'false' }]) {
      assert.equal(build(context(event), variables), true)
      assert.equal(upload(context(event), variables), false)
      assert.equal(deploy(context(event), variables), false)
    }
  }
})

test('publishing requires the enabled flag, main, the production repository and an allowed event', () => {
  const variables = { REACT_PAGES_DEPLOY_ENABLED: 'true' }
  for (const event of ['push', 'workflow_dispatch']) {
    assert.equal(upload(context(event), variables), true)
    assert.equal(deploy(context(event), variables), true)
    assert.equal(build(context(event, 'refs/heads/feature/react-migration'), variables), false)
    assert.equal(upload(context(event, 'refs/heads/feature/react-migration'), variables), false)
    assert.equal(deploy(context(event, 'refs/heads/feature/react-migration'), variables), false)
    assert.equal(upload(context(event, 'refs/heads/main', 'someone/portfolio'), variables), false)
    assert.equal(deploy(context(event, 'refs/heads/main', 'someone/portfolio'), variables), false)
  }
  for (const event of ['pull_request', 'pull_request_target', 'workflow_run']) {
    assert.equal(build(context(event), variables), false)
    assert.equal(upload(context(event), variables), false)
    assert.equal(deploy(context(event), variables), false)
  }
})

test('Pages workflow publishes only dist after checks, with job isolation and no auto-enablement', () => {
  assert.match(workflow, /on:\n  push:\n    branches: \[main\]\n  workflow_dispatch:/)
  assert(!/pull_request:|workflow_run:|continue-on-error:|always\(/.test(workflow))
  assert.match(workflow, /concurrency:\n  group: pages\n  cancel-in-progress: false/)
  assert.match(workflow, /working-directory: react-app/)
  for (const command of ['npm ci', 'npm run lint', 'npm test', 'npm run build']) assert(workflow.includes('run: ' + command))
  assert(workflow.indexOf('run: npm run build') < workflow.indexOf('uses: actions/upload-pages-artifact@'))
  assert.match(workflow, /path: react-app\/dist\n/)
  assert.match(workflow, /  deploy:\n[\s\S]*?    needs: build\n/)
  assert.match(workflow, /permissions:\n  contents: read/)
  assert.match(workflow, /    permissions:\n      pages: write\n      id-token: write/)
  assert.match(workflow, /environment:\n      name: github-pages/)
  assert.match(workflow, /enablement: 'false'/)
  assert.equal((workflow.match(/uses: actions\/upload-pages-artifact@/g) || []).length, 1)
  assert.equal((workflow.match(/uses: actions\/deploy-pages@/g) || []).length, 1)
  assert.equal((workflow.match(/uses: actions\/[\w-]+@[a-f0-9]{40}/g) || []).length, 5)
})
