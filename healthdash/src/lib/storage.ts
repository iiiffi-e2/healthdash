import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type StorageResult = {
  storageKey: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
};

export interface StorageProvider {
  save(file: File): Promise<StorageResult>;
  getDownloadPath(storageKey: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private basePath = path.join(process.cwd(), "public", "uploads");

  async save(file: File): Promise<StorageResult> {
    await mkdir(this.basePath, { recursive: true });
    const extension = path.extname(file.name || "") || ".bin";
    const storageKey = `${Date.now()}-${randomUUID()}${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const destination = path.join(this.basePath, storageKey);

    await writeFile(destination, buffer);

    return {
      storageKey,
      url: `/uploads/${storageKey}`,
      sizeBytes: buffer.length,
      mimeType: file.type || "application/octet-stream",
    };
  }

  getDownloadPath(storageKey: string) {
    return path.join(this.basePath, storageKey);
  }
}

export const storageProvider = new LocalStorageProvider();
