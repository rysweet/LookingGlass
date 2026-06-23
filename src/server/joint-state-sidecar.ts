import * as fs from "fs";
import * as path from "path";
import type { JointStateStore } from "../joint-system.js";

const ALICE_WEB_SIDECAR_DIR = "alice-web";
const JOINT_STATE_FILENAME = "joint-state.json";

export function jointStateSidecarPath(rootDir: string): string {
  return path.join(rootDir, ALICE_WEB_SIDECAR_DIR, JOINT_STATE_FILENAME);
}

export async function writeJointStateSidecar(rootDir: string, jointState: JointStateStore): Promise<string> {
  const sidecarPath = jointStateSidecarPath(rootDir);
  await fs.promises.mkdir(path.dirname(sidecarPath), { recursive: true });
  await fs.promises.writeFile(sidecarPath, JSON.stringify(jointState.toJSON(), null, 2) + "\n");
  return sidecarPath;
}

export async function removeJointStateSidecar(rootDir: string): Promise<void> {
  const sidecarPath = jointStateSidecarPath(rootDir);
  try {
    await fs.promises.unlink(sidecarPath);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }
}
