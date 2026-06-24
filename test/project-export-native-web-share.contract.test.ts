import { describe, expect, it, vi } from "vitest";
import { exportWebPackage, generateShareArtifacts } from "../src/project-export.js";
import { createMinimalProject } from "./test-utils.js";

describe("project export native Web Share evidence", () => {
  it("records navigator.share delivery only after the native Web Share call succeeds", async () => {
    const project = createMinimalProject();
    project.projectName = "Native share proof";
    const exported = await exportWebPackage(project, {
      title: "Native share proof",
      description: "Camera/export/share parity evidence.",
      canonicalUrl: "https://example.edu/alice/native-share-proof",
    });
    const canShare = vi.fn(() => true);
    const share = vi.fn(async () => {});
    const file = {
      name: exported.package.filename,
      type: exported.package.mimeType,
    };

    const result = await generateShareArtifacts({
      packageBase64: exported.package.base64,
      title: "Native share proof",
      description: "Camera/export/share parity evidence.",
      canonicalUrl: "https://example.edu/alice/native-share-proof",
      nativeShare: {
        navigator: { canShare, share },
        files: [file],
      },
    });

    expect(canShare).toHaveBeenCalledWith(expect.objectContaining({
      title: "Native share proof",
      text: "Camera/export/share parity evidence.",
      url: "https://example.edu/alice/native-share-proof",
      files: [file],
    }));
    expect(share).toHaveBeenCalledTimes(1);
    expect(result.share.delivery).toEqual({
      mode: "native-web-share",
      nativeWebShare: true,
      requiresUserDownload: false,
      evidence: {
        api: "navigator.share",
        status: "shared",
        packageFilename: exported.package.filename,
        filesShared: true,
        canShareChecked: true,
      },
    });
    expect(result.validation.valid).toBe(true);
  });

  it("keeps the browser-download fallback when native Web Share cannot accept the package", async () => {
    const project = createMinimalProject();
    const exported = await exportWebPackage(project, { title: "Fallback proof" });
    const share = vi.fn(async () => {});

    const result = await generateShareArtifacts({
      packageBase64: exported.package.base64,
      title: "Fallback proof",
      nativeShare: {
        navigator: {
          canShare: () => false,
          share,
        },
      },
    });

    expect(share).not.toHaveBeenCalled();
    expect(result.share.delivery).toMatchObject({
      mode: "browser-download-fallback",
      nativeWebShare: false,
      requiresUserDownload: true,
    });
  });
});
