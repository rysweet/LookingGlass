import { describe, expect, it } from "vitest";
import * as PublicApi from "../src/index.js";
import * as AliceWorkflowState from "../src/alice-workflow-state.js";
import * as CameraWorkflow from "../src/camera-workflow.js";

describe("Alice score and time workflow public API", () => {
  it("exports the Alice score and time workflow from the public package surface", () => {
    expect(PublicApi).toHaveProperty("AliceWorkflowState");
    expect(PublicApi.AliceWorkflowState).toBe(AliceWorkflowState);
    expect(PublicApi.AliceWorkflowState.ALICE_WORKFLOW_STATE_SCHEMA_VERSION).toBe(
      "alice-web.workflow-state/v1",
    );

    for (const functionName of [
      "createDefaultAliceWorkflowState",
      "validateAliceWorkflowState",
      "addScorekeeper",
      "addTimekeeper",
      "bindVisibleWorkflowState",
      "resolveVisibleWorkflowBindings",
    ] as const) {
      expect(PublicApi.AliceWorkflowState[functionName]).toBe(AliceWorkflowState[functionName]);
    }
  });
});

describe("camera workflow public API", () => {
  it("exports the Alice camera workflow from the public package surface", () => {
    expect(PublicApi).toHaveProperty("CameraWorkflow");
    expect(PublicApi.CameraWorkflow).toBe(CameraWorkflow);
    expect(PublicApi.CameraWorkflow.CAMERA_WORKFLOW_SCHEMA_VERSION).toBe(
      "eatme.alice-camera-workflow-state/v1",
    );

    for (const functionName of [
      "createDefaultCameraWorkflowState",
      "cloneCameraWorkflowState",
      "validateCameraWorkflowState",
      "moveCamera",
      "panCamera",
      "zoomCamera",
      "focusCamera",
      "orbitCamera",
      "applyCameraPreset",
      "setCameraMode",
      "saveCameraMarker",
      "restoreCameraMarker",
      "deleteCameraMarker",
      "listCameraMarkers",
    ] as const) {
      expect(PublicApi.CameraWorkflow[functionName]).toBe(CameraWorkflow[functionName]);
    }
  });

  it("preserves Alice identity and does not add LookingGlass runtime namespaces", () => {
    const exportNames = Object.keys(PublicApi);

    expect(exportNames).toContain("CameraWorkflow");
    expect(exportNames).toContain("AliceWorkflowState");
    expect(exportNames).not.toContain("LookingGlassCameraWorkflow");
    expect(exportNames).not.toContain("LookingGlassCamera");
    expect(exportNames).not.toContain("LookingGlassWorkflowState");
    expect(exportNames).not.toContain("LookingGlass");
  });
});
