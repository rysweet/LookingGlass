import { describe, expect, it } from "vitest";
import {
  createAccessibilityRescueCaptionEvidence,
  createCameraVrComfortEvidence,
  createGalleryWalkRubricEvidence,
  createRuntimeParityEvidence,
} from "../src/runtime-parity-evidence";
import { createDefaultCameraWorkflowState } from "../src/camera-workflow";
import { validateAliceEvidenceArtifact, type AliceEvidenceRuntimeReview } from "../src/alice-evidence-artifact";

const camera = createDefaultCameraWorkflowState().camera;
const LONG_RUNTIME_VALUE = "x".repeat(1024);

describe("runtime parity evidence", () => {
  it("records browser camera comfort without claiming true headset VR support", () => {
    const evidence = createCameraVrComfortEvidence({
      camera,
      webxrReport: {
        status: "unsupported",
        immersiveVrSupported: false,
        referenceSpaces: { preferred: "local-floor", available: [] },
        input: { controllersSupported: false, handsSupported: false, gamepadsSupported: false },
        evidence: [
          {
            code: "immersive-vr-unsupported",
            severity: "unsupported",
            message: "Browser does not support immersive-vr.",
          },
        ],
      },
    });

    expect(evidence.status).toBe("partial");
    expect(evidence.desktopCameraAvailable).toBe(true);
    expect(evidence.keyboardMovementAvailable).toBe("unknown");
    expect(evidence.reducedMotionRespected).toBe("unknown");
    expect(evidence.trueHeadsetVrSupported).toBe(false);
    expect(evidence.nativeVrSupported).toBe(false);
    expect(evidence.evidenceCodes).toContain("immersive-vr-unsupported");
    expect(evidence.unsupportedReason).toContain("true headset/native VR remains unsupported");
  });

  it("creates accessibility rescue captions from camera and scene objects", () => {
    const evidence = createAccessibilityRescueCaptionEvidence({
      camera,
      statusText: "Loaded Bunny World.",
      project: {
        version: "3.10",
        projectName: "Bunny World",
        sceneObjects: [
          { name: "bunny", typeName: "org.lgna.story.SBiped", resourceType: null, position: null, orientation: null, size: null },
        ],
        methods: [],
      },
    });

    expect(evidence.status).toBe("partial");
    expect(evidence.ariaLiveCaption).toBe("Loaded Bunny World.");
    expect(evidence.cameraCaption).toContain("Camera orbit view");
    expect(evidence.objectCaption).toContain("bunny");
    expect(evidence.captionChecks.every((check) => check.present)).toBe(true);
    expect(evidence.captionChecks.find((check) => check.id === "aria-live-status")?.channel).toBe("aria-live");
    expect(evidence.keyboardReviewAvailable).toBe("unknown");
    expect(evidence.highContrastReviewAvailable).toBe("unknown");
  });

  it("creates gallery walk rubric evidence while keeping live studio unsupported", () => {
    const evidence = createGalleryWalkRubricEvidence({
      project: {
        version: "3.10",
        projectName: "Review World",
        sceneObjects: [
          { name: "hero", typeName: "org.lgna.story.SBiped", resourceType: null, position: null, orientation: null, size: null },
          { name: "goal", typeName: "org.lgna.story.SProp", resourceType: null, position: null, orientation: null, size: null },
        ],
        methods: [],
      },
    });

    expect(evidence.reviewWorkflowSupported).toBe(false);
    expect(evidence.rubricRecordingSupported).toBe(false);
    expect(evidence.liveStudioSupported).toBe(false);
    expect(evidence.galleryItems.map((item) => item.title)).toEqual(["hero", "goal"]);
    expect(evidence.rubric.map((criterion) => criterion.id)).toContain("accessibility-captions");
  });

  it("bundles the three runtime parity evidence sections", () => {
    const evidence = createRuntimeParityEvidence({ camera });

    expect(evidence.cameraVrComfort.schema_version).toBe("alice.camera-vr-comfort-evidence/v1");
    expect(evidence.accessibilityRescueCaptions.schema_version).toBe("alice.accessibility-rescue-camera-captions/v1");
    expect(evidence.galleryWalkRubric.schema_version).toBe("alice.gallery-walk-rubric-evidence/v1");
  });

  it("bounds long status, object, and project strings at the producer boundary", () => {
    const project = {
      version: "3.10",
      projectName: LONG_RUNTIME_VALUE,
      sceneObjects: [
        { name: LONG_RUNTIME_VALUE, typeName: "org.lgna.story.SProp", resourceType: null, position: null, orientation: null, size: null },
      ],
      methods: [],
    };
    const captions = createAccessibilityRescueCaptionEvidence({
      camera,
      statusText: LONG_RUNTIME_VALUE,
      project,
    });
    const gallery = createGalleryWalkRubricEvidence({ project });

    expect(captions.ariaLiveCaption).toHaveLength(500);
    expect(captions.objectCaption.length).toBeLessThanOrEqual(500);
    expect(captions.captionChecks.every((check) => check.text.length <= 500)).toBe(true);
    expect(gallery.projectName).toHaveLength(500);
    expect(gallery.galleryItems.every((item) => item.title.length <= 500 && item.reviewPrompt.length <= 500)).toBe(true);
    expectRuntimeReviewContract({ accessibilityRescueCaptions: captions });
    expectRuntimeReviewContract({ galleryWalkRubric: gallery });
  });
});

function expectRuntimeReviewContract(runtimeReview: AliceEvidenceRuntimeReview): void {
  const validation = validateAliceEvidenceArtifact({
    format: "alice-visible-behavior-evidence",
    version: 1,
    application: { name: "Alice", runtime: "alice-web" },
    world: { name: "Runtime parity test", aliceVersion: "3.10", objectCount: 1 },
    run: { id: "run-2026-06-23T09-21-35-874Z", capturedAt: "2026-06-23T09:21:35.874Z" },
    visibleBehavior: {
      statusText: "Runtime parity test",
      viewport: {
        width: 800,
        height: 600,
        canvasSnapshot: { available: false },
      },
      camera: {
        mode: "orbit",
        position: { x: 0, y: 1, z: 6 },
        target: { x: 0, y: 1, z: 0 },
      },
      objects: [
        {
          name: "test-object",
          typeName: "org.lgna.story.SProp",
          visible: true,
          position: { x: 0, y: 0, z: 0 },
        },
      ],
    },
    runtimeReview,
    export: {
      method: "download",
      requestedAt: "2026-06-23T09:21:35.874Z",
      filename: "runtime-parity-test.json",
      mimeType: "application/json",
    },
  });
  expect(validation).toEqual({ valid: true, errors: [] });
}
