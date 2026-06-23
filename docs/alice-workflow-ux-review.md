---
title: "Alice workflow UX review checkpoints"
description: Durable checkpoint contract for human review of Alice workflows that automated tests cannot fully judge.
review_schedule: quarterly
doc_type: how-to
---

# Alice workflow UX review checkpoints

Automated tests verify behavior and artifacts, but they do not fully judge
interaction quality. Use these checkpoints when a PR or parity issue changes
Scene Editor, Code Editor, camera, joint, or player/export workflows.

Record review outcomes in GitHub issues or PR comments. Do not commit generated
review reports, screenshots, transcripts, or point-in-time summaries to the
repository.

## Checkpoints

| Checkpoint | Workflow area | Human review focus |
| --- | --- | --- |
| `scene-editor` | Scene Editor | Object creation, selection, transforms, canvas/list/status alignment, and actionable validation messages. |
| `code-editor` | Code Editor | Procedure authoring, validation feedback, learner-facing terminology, and generated TypeScript handoff. |
| `camera` | Camera | Movement, view switching, marker feedback, comfort, and accurate unsupported headset/native VR labeling. |
| `joints` | Object Joints | Joint discovery, pose application, selected-joint feedback, and saved/reopened state clarity. |
| `player-export` | Player / Export | Package download, preview/share fallback messaging, imported media representation, and unsupported capability boundaries. |

The source of truth for checkpoint ids, automated evidence pointers, and review
prompts is `src/server/alice-workflow-ux-review.ts`.

## How to record a review

1. Open a GitHub issue with the **Alice workflow UX review** template, or add a
   PR comment using the same fields.
2. Select one checkpoint id.
3. Link the PR, issue, HowTo id, or executable scenario id that triggered the
   review.
4. Record the exact human steps performed.
5. Record observations that automated tests do not prove.
6. Set the verdict to `pass`, `needs-follow-up`, or `blocked`.
7. Link follow-up issues when the verdict is not `pass`.

## Output rules

- Keep review outputs in GitHub issues or PR comments.
- Keep generated screenshots or videos as GitHub attachments or CI artifacts.
- Do not add point-in-time review reports to `docs/` or any committed source
  directory.
- Do not use a human review to claim broad Alice parity; scope the finding to
  the reviewed checkpoint and scenario.

## Related automation

Use the automated tests listed in each checkpoint as setup evidence before human
review. Human review complements those checks; it does not replace build, test,
or parity audit validation.
