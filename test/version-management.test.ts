import { describe, expect, it } from "vitest";
import {
  AliceVersion,
  VersionNotSupportedError,
  assertCompatibleVersion,
  assessCompatibility,
  buildCompatibilityMatrix,
  compareVersions,
  computeMigrationPath,
  getArchiveEncodingForVersion,
  getCurrentProjectVersion,
  isValidVersion,
} from "../src/version-management.js";

describe("version-management", () => {
  it("round-trips semantic Alice versions", () => {
    const version = new AliceVersion("3.14.0.4-alpha.2+build.local");
    expect(version.isValid()).toBe(true);
    expect(version.toString()).toBe("3.14.0.4-alpha.2+build.local");
  });

  it("treats invalid numeric segments as invalid", () => {
    expect(isValidVersion("3vhs14.0.4-alpha.2+build.local")).toBe(false);
    expect(isValidVersion("3.14.0.4alpha.2+build.local")).toBe(false);
  });

  it("compares legacy trailing zero segments as equal", () => {
    expect(compareVersions("3.3.0.0.0", "3.3.0.0")).toBe(0);
  });

  it("orders prerelease before release and ignores metadata", () => {
    expect(compareVersions("3.14.0.4-alpha.2", "3.14.0.4")).toBeLessThan(0);
    expect(compareVersions("3.14.0.4+build.one", "3.14.0.4+build.two")).toBe(0);
  });

  it("switches archive encoding at Alice 3.7", () => {
    expect(getArchiveEncodingForVersion("3.6.0.0")).toBe("utf8");
    expect(getArchiveEncodingForVersion("3.7.0.0")).toBe("utf16");
    expect(getArchiveEncodingForVersion("3.8.0.0")).toBe("utf16");
  });

  it("computes migration milestones toward the current reader", () => {
    const path = computeMigrationPath("3.1.9.0.0").map((version) => version.toString());
    expect(path).toEqual([
      "3.1.20.0.0",
      "3.1.35.0.0",
      "3.4.0.0",
      "3.9.0.0",
      getCurrentProjectVersion().toString(),
    ]);
  });

  it("reports unsupported old and future versions", () => {
    const tooOld = assessCompatibility("3.1.7.0.0");
    expect(tooOld.supported).toBe(false);
    expect(tooOld.reason).toContain("migration floor");

    const future = assessCompatibility("9.0.0.0");
    expect(future.supported).toBe(false);
    expect(future.isFutureVersion).toBe(true);
  });

  it("throws a typed compatibility error for unsupported versions", () => {
    expect(() => assertCompatibleVersion("3.1.7.0.0")).toThrow(VersionNotSupportedError);
  });

  it("builds a compatibility matrix with supported and unsupported ranges", () => {
    const matrix = buildCompatibilityMatrix();
    expect(matrix.some((entry) => entry.supported)).toBe(true);
    expect(matrix.some((entry) => !entry.supported)).toBe(true);
  });
});
