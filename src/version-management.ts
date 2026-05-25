import { getCurrentAliceVersion } from "./project-migration.js";

export type ArchiveEncoding = "utf8" | "utf16";

export interface CompatibilityMatrixEntry {
  readonly range: string;
  readonly supported: boolean;
  readonly encoding: ArchiveEncoding;
  readonly notes: string;
}

export interface CompatibilityAssessment {
  readonly version: AliceVersion;
  readonly currentVersion: AliceVersion;
  readonly minimumSupportedVersion: AliceVersion;
  readonly supported: boolean;
  readonly needsMigration: boolean;
  readonly isFutureVersion: boolean;
  readonly encoding: ArchiveEncoding;
  readonly migrationPath: AliceVersion[];
  readonly reason: string | null;
}

const CURRENT_VERSION_TEXT = getCurrentAliceVersion();
const MINIMUM_SUPPORTED_VERSION_TEXT = "3.1.8.0.0";
const MIGRATION_MILESTONES = [
  "3.1.20.0.0",
  "3.1.35.0.0",
  "3.4.0.0",
  "3.9.0.0",
  CURRENT_VERSION_TEXT,
] as const;

export class AliceVersion implements ComparableAliceVersion {
  static readonly VERSION_3_7 = new AliceVersion("3.7.0.0");

  readonly subNumbers: number[];
  readonly prerelease: string | null;
  readonly metadata: string | null;

  constructor(text: string) {
    const trimmed = text.trim();
    const metadataIndex = trimmed.indexOf("+");
    const withoutMetadata = metadataIndex >= 0 ? trimmed.slice(0, metadataIndex) : trimmed;
    this.metadata = metadataIndex >= 0 ? trimmed.slice(metadataIndex + 1) || null : null;

    const prereleaseIndex = withoutMetadata.indexOf("-");
    const withoutPrerelease = prereleaseIndex >= 0 ? withoutMetadata.slice(0, prereleaseIndex) : withoutMetadata;
    this.prerelease = prereleaseIndex >= 0 ? withoutMetadata.slice(prereleaseIndex + 1) || null : null;

    this.subNumbers = withoutPrerelease
      .split(".")
      .map((part) => (/^\d+$/u.test(part)
        ? Number.parseInt(part, 10)
        : -1));
  }

  get aliceIdentifier(): number {
    return this.subNumbers[0] ?? -1;
  }

  get major(): number {
    return this.subNumbers[1] ?? -1;
  }

  get minor(): number {
    return this.subNumbers[2] ?? -1;
  }

  get patch(): number {
    return this.subNumbers[3] ?? -1;
  }

  isValid(): boolean {
    return this.subNumbers.length > 0 && this.subNumbers.every((value) => value >= 0);
  }

  hasPrerelease(): boolean {
    return typeof this.prerelease === "string" && this.prerelease.length > 0;
  }

  hasMetadata(): boolean {
    return typeof this.metadata === "string" && this.metadata.length > 0;
  }

  compareTo(other: AliceVersion): number {
    const length = Math.max(this.subNumbers.length, other.subNumbers.length);
    for (let index = 0; index < length; index += 1) {
      const left = this.subNumbers[index] ?? 0;
      const right = other.subNumbers[index] ?? 0;
      if (left !== right) {
        return left < right ? -1 : 1;
      }
    }
    if (this.hasPrerelease() && !other.hasPrerelease()) {
      return -1;
    }
    if (!this.hasPrerelease() && other.hasPrerelease()) {
      return 1;
    }
    return 0;
  }

  equals(other: AliceVersion): boolean {
    return this.compareTo(other) === 0;
  }

  toString(): string {
    let text = this.subNumbers.join(".");
    if (this.hasPrerelease()) {
      text += `-${this.prerelease}`;
    }
    if (this.hasMetadata()) {
      text += `+${this.metadata}`;
    }
    return text;
  }
}

interface ComparableAliceVersion {
  compareTo(other: AliceVersion): number;
}

export class VersionNotSupportedError extends Error {
  readonly minimumSupportedVersion: AliceVersion;
  readonly version: AliceVersion;

  constructor(minimumSupportedVersion: string | AliceVersion, version: string | AliceVersion) {
    const minimum = toAliceVersion(minimumSupportedVersion);
    const actual = toAliceVersion(version);
    super(`Alice version ${actual} is not supported; minimum supported version is ${minimum}`);
    this.name = "VersionNotSupportedError";
    this.minimumSupportedVersion = minimum;
    this.version = actual;
  }
}

export function getCurrentProjectVersion(): AliceVersion {
  return new AliceVersion(CURRENT_VERSION_TEXT);
}

export function getMinimumSupportedVersion(): AliceVersion {
  return new AliceVersion(MINIMUM_SUPPORTED_VERSION_TEXT);
}

export function isValidVersion(value: string): boolean {
  return new AliceVersion(value).isValid();
}

export function compareVersions(left: string | AliceVersion, right: string | AliceVersion): number {
  return toAliceVersion(left).compareTo(toAliceVersion(right));
}

export function getArchiveEncodingForVersion(version: string | AliceVersion): ArchiveEncoding {
  return compareVersions(version, AliceVersion.VERSION_3_7) < 0 ? "utf8" : "utf16";
}

export function computeMigrationPath(
  from: string | AliceVersion,
  to: string | AliceVersion = getCurrentProjectVersion(),
): AliceVersion[] {
  const fromVersion = toAliceVersion(from);
  const toVersion = toAliceVersion(to);
  if (!fromVersion.isValid() || !toVersion.isValid() || fromVersion.compareTo(toVersion) >= 0) {
    return [];
  }

  const milestones = MIGRATION_MILESTONES
    .map((version) => new AliceVersion(version))
    .filter((milestone) => fromVersion.compareTo(milestone) < 0 && milestone.compareTo(toVersion) <= 0);

  if (milestones.length === 0 || !milestones[milestones.length - 1].equals(toVersion)) {
    milestones.push(new AliceVersion(toVersion.toString()));
  }

  return dedupeVersions(milestones);
}

export function assessCompatibility(version: string | AliceVersion): CompatibilityAssessment {
  const candidate = toAliceVersion(version);
  const currentVersion = getCurrentProjectVersion();
  const minimumSupportedVersion = getMinimumSupportedVersion();

  if (!candidate.isValid()) {
    return {
      version: candidate,
      currentVersion,
      minimumSupportedVersion,
      supported: false,
      needsMigration: false,
      isFutureVersion: false,
      encoding: getArchiveEncodingForVersion(candidate),
      migrationPath: [],
      reason: "Version string is not a valid Alice semantic version.",
    };
  }

  if (candidate.compareTo(minimumSupportedVersion) < 0) {
    return {
      version: candidate,
      currentVersion,
      minimumSupportedVersion,
      supported: false,
      needsMigration: false,
      isFutureVersion: false,
      encoding: getArchiveEncodingForVersion(candidate),
      migrationPath: [],
      reason: `Projects older than ${minimumSupportedVersion} are below the supported migration floor.`,
    };
  }

  if (candidate.compareTo(currentVersion) > 0) {
    return {
      version: candidate,
      currentVersion,
      minimumSupportedVersion,
      supported: false,
      needsMigration: false,
      isFutureVersion: true,
      encoding: getArchiveEncodingForVersion(candidate),
      migrationPath: [],
      reason: `Projects newer than ${currentVersion} may contain features this prototype does not understand yet.`,
    };
  }

  const migrationPath = computeMigrationPath(candidate, currentVersion);
  return {
    version: candidate,
    currentVersion,
    minimumSupportedVersion,
    supported: true,
    needsMigration: migrationPath.length > 0,
    isFutureVersion: false,
    encoding: getArchiveEncodingForVersion(candidate),
    migrationPath,
    reason: null,
  };
}

export function assertCompatibleVersion(version: string | AliceVersion): CompatibilityAssessment {
  const assessment = assessCompatibility(version);
  if (!assessment.supported) {
    throw new VersionNotSupportedError(assessment.minimumSupportedVersion, assessment.version);
  }
  return assessment;
}

export function buildCompatibilityMatrix(): CompatibilityMatrixEntry[] {
  const current = getCurrentProjectVersion();
  const minimum = getMinimumSupportedVersion();
  return [
    {
      range: `< ${minimum}`,
      supported: false,
      encoding: "utf8",
      notes: "Below the supported migration floor.",
    },
    {
      range: `${minimum} – 3.6.x`,
      supported: true,
      encoding: "utf8",
      notes: "Supported with legacy UTF-8 archive decoding and migration steps.",
    },
    {
      range: `3.7.0.0 – ${current}`,
      supported: true,
      encoding: "utf16",
      notes: "Supported with UTF-16 archive decoding; migration depends on project age.",
    },
    {
      range: `> ${current}`,
      supported: false,
      encoding: "utf16",
      notes: "Produced by a newer Alice build than this prototype knows how to read.",
    },
  ];
}

function dedupeVersions(versions: AliceVersion[]): AliceVersion[] {
  const deduped: AliceVersion[] = [];
  for (const version of versions) {
    if (!deduped.some((candidate) => candidate.equals(version))) {
      deduped.push(version);
    }
  }
  return deduped;
}

function toAliceVersion(value: string | AliceVersion): AliceVersion {
  return value instanceof AliceVersion ? value : new AliceVersion(value);
}
