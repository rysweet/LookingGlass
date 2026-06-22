---
title: "Alice HowTo parity audit"
description: Workflow for checking that every saved Alice.org HowTo has executable alice-web coverage.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: how-to
---

# Alice HowTo parity audit

Use the Alice HowTo parity audit to check that the saved Alice.org HowTo
inventory contains exactly 54 entries and that every HowTo maps to executable
alice-web coverage.

The audit is deterministic. It reads checked-in JSON inputs, checks file
references, and writes JSON only to stdout or to an explicit caller-chosen
output path.

## Contents

- [Run the audit](#run-the-audit)
- [Write JSON for CI artifacts](#write-json-for-ci-artifacts)
- [Read the terminal summary](#read-the-terminal-summary)
- [Fix audit failures](#fix-audit-failures)
- [Revise the saved HowTo baseline](#revise-the-saved-howto-baseline)
- [Related reference](#related-reference)

## Run the audit

Build the server-side CLI, then run the audit with its default inputs:

```bash
export NODE_OPTIONS=--max-old-space-size=32768
npm run build:server
node dist-server/cli.js alice-howto-parity-audit
```

The installed package exposes the same command as `alice-web`:

```bash
alice-web alice-howto-parity-audit
```

By default, the command reads:

| Input | Default path |
| --- | --- |
| Alice.org HowTo inventory | `data/alice-org-howto-inventory.json` |
| Coverage mapping | `data/alice-howto-coverage-map.json` |

The command does not scrape Alice.org, GitHub, RabbitHole, or any network
resource. The RabbitHole comparison baseline is always
`rysweet/RabbitHole origin/develop`.

## Write JSON for CI artifacts

Without `--output`, the command writes the audit JSON to stdout and the concise
human summary to stderr:

```bash
node dist-server/cli.js alice-howto-parity-audit \
  > "$RUNNER_TEMP/alice-howto-parity-audit.json"
```

Use `--output` when a CI step needs an explicit artifact file:

```bash
node dist-server/cli.js alice-howto-parity-audit \
  --output "$RUNNER_TEMP/alice-howto-parity-audit.json"
```

Prefer temporary directories, CI artifact paths, or PR comments for generated
reports. If a caller explicitly chooses a repository path with `--output`, treat
that file as generated evidence and do not commit it.

## Read the terminal summary

A passing audit prints a short summary:

```text
Alice HowTo parity audit: PASS
Inventory: 54/54 Alice.org HowTos
Coverage: 54/54 mapped to executable artifacts
RabbitHole baseline: rysweet/RabbitHole origin/develop
```

A failing audit stays concise and points to the JSON details:

```text
Alice HowTo parity audit: FAIL
Inventory: 53/54 Alice.org HowTos
Coverage: 52/53 mapped to executable artifacts
Errors: 2
RabbitHole baseline: rysweet/RabbitHole origin/develop
```

Use the exit code to gate CI:

| Exit code | Meaning |
| --- | --- |
| `0` | Inventory count, mappings, and artifact references passed |
| `1` | The audit found parity problems, or the command could not complete because inputs, options, or output paths were invalid |

When the command can run the audit, use the JSON `passed` field and `errors`
array to distinguish parity failures. Invalid command usage may print only to
stderr and may not produce audit JSON.

## Fix audit failures

### Inventory count is not 54

Open `data/alice-org-howto-inventory.json` and compare it with the saved
Alice.org HowTo source used for alice-web parity. The inventory must contain
exactly 54 entries. Each entry needs a unique non-empty `id` and `title`.

### A HowTo has no coverage mapping

Add the missing HowTo ID to the `mappings` array in
`data/alice-howto-coverage-map.json` and map it to at least one executable
repository artifact:

```json
{
  "id": "events-when-key-is-typed",
  "artifacts": [
    {
      "type": "vitest",
      "path": "test/event-system.test.ts",
      "name": "keyboard event behavior"
    }
  ]
}
```

Allowed artifact types are `vitest`, `gadugi`, `scenario`, and `other`.

### A mapped artifact is missing

Update the mapping to point at an existing executable file, or add the missing
test or scenario file. Artifact paths must be repository-relative files. Absolute
paths, `..` traversal, directories, and symlink escapes are rejected.

## Revise the saved HowTo baseline

The default contract is pinned to the saved 54-entry Alice.org HowTo baseline.
When intentionally revising that saved baseline:

1. Update `data/alice-org-howto-inventory.json` with the intended 54 entries.
2. Add or update the Vitest test, Gadugi scenario, or equivalent executable
   scenario file that proves alice-web behavior.
3. Add the HowTo ID to `data/alice-howto-coverage-map.json`.
4. Run the audit:

```bash
export NODE_OPTIONS=--max-old-space-size=32768
npm run build:server
node dist-server/cli.js alice-howto-parity-audit
```

The audit validates that coverage references exist. It does not run the mapped
test suite. Run the focused test or scenario separately when changing behavior.

Changing the expected count away from 54 is a contract change. Update the
expected-count constant, tests, and documentation in the same change.

## Related reference

- [Alice HowTo parity audit reference](./alice-howto-parity-audit-reference.md)
- [Testing](./testing.md)
- [Gadugi test scenarios](./gadugi-test-scenarios.md)
- [Alice identity boundary](./alice-identity-boundary.md)
