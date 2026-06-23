export const ALICE_WORKFLOW_UX_REVIEW_SCHEMA_VERSION = "alice-web.workflow-ux-review/v1" as const;
export const ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET = "github-issue-or-pr-comment" as const;

export type AliceWorkflowUxReviewId =
  | "scene-editor"
  | "code-editor"
  | "camera"
  | "joints"
  | "player-export";

export interface AliceWorkflowUxReviewCheckpoint {
  readonly id: AliceWorkflowUxReviewId;
  readonly title: string;
  readonly aliceWorkflowArea: string;
  readonly automatedEvidence: readonly string[];
  readonly humanReviewPrompts: readonly string[];
  readonly outputTarget: typeof ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET;
}

export const ALICE_WORKFLOW_UX_REVIEW_CHECKPOINTS: readonly AliceWorkflowUxReviewCheckpoint[] = [
  {
    id: "scene-editor",
    title: "Scene editor interaction review",
    aliceWorkflowArea: "Scene Editor",
    automatedEvidence: [
      "test/scene-editor.test.ts",
      "test/gallery-scene-integration.test.ts",
      "gadugi/03-scene-entity-manipulation.yaml",
    ],
    humanReviewPrompts: [
      "Can a reviewer add, select, move, turn, and resize objects without ambiguous feedback?",
      "Do object list, scene canvas, and status messages stay aligned after each interaction?",
      "Are validation errors visible and actionable when object input is incomplete?",
    ],
    outputTarget: ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET,
  },
  {
    id: "code-editor",
    title: "Code editor workflow review",
    aliceWorkflowArea: "Code Editor",
    automatedEvidence: [
      "test/code-editor.test.ts",
      "test/create-procedure-function.test.ts",
      "test/tweedle-codegen.test.ts",
    ],
    humanReviewPrompts: [
      "Can a reviewer create and edit procedures while preserving understandable Alice terminology?",
      "Do syntax, validation, and run feedback explain what the learner should fix next?",
      "Does generated TypeScript represent the authored behavior without surprising renaming?",
    ],
    outputTarget: ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET,
  },
  {
    id: "camera",
    title: "Camera workflow review",
    aliceWorkflowArea: "Camera",
    automatedEvidence: [
      "test/camera-workflow.test.ts",
      "test/camera-routes.test.ts",
      "e2e/app-flow.spec.ts",
    ],
    humanReviewPrompts: [
      "Can a reviewer move the camera, switch views, and save markers with clear feedback?",
      "Do camera controls avoid disorienting jumps during normal Alice authoring tasks?",
      "Are unsupported headset/native VR behaviors labeled without implying support that is not implemented?",
    ],
    outputTarget: ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET,
  },
  {
    id: "joints",
    title: "Joint manipulation review",
    aliceWorkflowArea: "Object Joints",
    automatedEvidence: [
      "test/joint-system.test.ts",
      "test/joint-state-store-contract.test.ts",
      "test/model-texture-camera-joint-export-workflow.contract.test.ts",
    ],
    humanReviewPrompts: [
      "Can a reviewer identify available joints and apply poses without losing object context?",
      "Does visual feedback make the selected joint and applied pose understandable?",
      "Do saved and reopened projects preserve reviewed joint state clearly?",
    ],
    outputTarget: ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET,
  },
  {
    id: "player-export",
    title: "Player and export workflow review",
    aliceWorkflowArea: "Player / Export",
    automatedEvidence: [
      "test/export-html.test.ts",
      "test/project-export.test.ts",
      "gadugi/06-web-player-export-share-parity.yaml",
    ],
    humanReviewPrompts: [
      "Can a reviewer export, download, and open the player package with clear next-step guidance?",
      "Do preview, package, and share fallback messages match the actual browser-download behavior?",
      "Are imported media resources represented without claiming unsupported native playback or model rendering?",
    ],
    outputTarget: ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET,
  },
] as const;

export function findAliceWorkflowUxReviewCheckpoint(
  id: AliceWorkflowUxReviewId,
): AliceWorkflowUxReviewCheckpoint {
  const checkpoint = ALICE_WORKFLOW_UX_REVIEW_CHECKPOINTS.find((item) => item.id === id);
  if (!checkpoint) {
    throw new Error(`Unknown Alice workflow UX review checkpoint: ${id}`);
  }
  return checkpoint;
}
