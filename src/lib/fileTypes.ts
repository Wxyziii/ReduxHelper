import type { FileStatus } from "../types/project";

const readable = new Set([".xml", ".dat", ".meta", ".ini", ".txt", ".json", ".cfg"]);
const binaryUnsupported = new Set([".rpf", ".ytd", ".ypt", ".ydr", ".ydd", ".awc", ".dds"]);

export function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export function detectFileStatus(extension: string): FileStatus {
  if (readable.has(extension)) return "text-readable";
  if (binaryUnsupported.has(extension)) return "binary-unsupported";
  return "unsupported";
}

export function getFileWarnings(extension: string, status: FileStatus) {
  if (status === "binary-unsupported") {
    return [`${extension || "File"} is binary/unsupported in Phase 2. Copied only, not read or edited.`];
  }
  if (status === "unsupported") {
    return [`${extension || "File"} is not supported yet. Copied for tracking only.`];
  }
  return [];
}
