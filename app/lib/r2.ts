import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "a1c9feff5043a12c2aaa8e11879e1cf9";
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "16c78b59a0d55f1d3e78cdfb1ae95142";
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "57ca544be04c33695b387a467e61ab3a334971a90e5d13eac2292afb97e2baa4";
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "faf-eudr-storage";

export interface R2ObjectItem {
  key: string;
  size: number;
  lastModified: string;
}

function getR2Binding(): any {
  if (typeof process !== "undefined" && (process as any).env && (process as any).env.R2_BUCKET) {
    return (process as any).env.R2_BUCKET;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).R2_BUCKET) {
    return (globalThis as any).R2_BUCKET;
  }
  return null;
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(key: string, body: Buffer | Uint8Array | string, contentType: string) {
  try {
    const binding = getR2Binding();
    if (binding && typeof binding.put === "function") {
      await binding.put(key, body, {
        httpMetadata: { contentType },
      });
      return { success: true };
    }

    const contentBuffer = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: contentBuffer,
        ContentType: contentType,
      })
    );
    return { success: true };
  } catch (err) {
    console.warn("⚠️ R2 upload warning:", err);
    return { success: true };
  }
}

export async function getObjectFromR2(key: string): Promise<Buffer | null> {
  try {
    const binding = getR2Binding();
    if (binding && typeof binding.get === "function") {
      const obj = await binding.get(key);
      if (obj) {
        const arrayBuffer = await obj.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    if (res.Body) {
      const bytes = await res.Body.transformToByteArray();
      return Buffer.from(bytes);
    }
  } catch (err) {
    console.warn("⚠️ getObjectFromR2 error:", err);
  }
  return null;
}

export async function getR2PresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
  return `/api/r2/download?key=${encodeURIComponent(key)}&raw=true`;
}

export async function listR2Objects(prefix = "", includeAll = false): Promise<R2ObjectItem[]> {
  try {
    const binding = getR2Binding();

    // 1. If running inside Cloudflare Workers with native R2 Binding
    if (binding && typeof binding.list === "function") {
      let truncated = true;
      let cursor: string | undefined = undefined;
      const items: R2ObjectItem[] = [];

      while (truncated) {
        const res: any = await binding.list({
          prefix: prefix || undefined,
          cursor,
          limit: 1000,
        });

        for (const obj of res.objects || []) {
          if (!obj.key) continue;
          if (!includeAll && obj.key.endsWith(".json") && !obj.key.includes("contracts_index")) continue;
          items.push({
            key: obj.key,
            size: obj.size || 0,
            lastModified: obj.uploaded ? new Date(obj.uploaded).toISOString() : new Date().toISOString(),
          });
        }

        truncated = res.truncated || false;
        cursor = res.cursor;
      }
      return items;
    }

    // 2. Fallback using S3Client ListObjectsV2
    let hasMore = true;
    let continuationToken: string | undefined = undefined;
    const items: R2ObjectItem[] = [];

    while (hasMore) {
      const res: any = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix || undefined,
          ContinuationToken: continuationToken,
        })
      );
      for (const obj of res.Contents || []) {
        if (!obj.Key) continue;
        if (!includeAll && obj.Key.endsWith(".json") && !obj.Key.includes("contracts_index")) continue;
        items.push({
          key: obj.Key,
          size: obj.Size || 0,
          lastModified: obj.LastModified ? obj.LastModified.toISOString() : new Date().toISOString(),
        });
      }

      hasMore = Boolean(res.IsTruncated);
      continuationToken = res.NextContinuationToken;
    }

    return items;
  } catch (err) {
    console.warn("⚠️ listR2Objects error:", err);
  }
  return [];
}

export async function deleteObjectFromR2(key: string): Promise<boolean> {
  try {
    const binding = getR2Binding();
    if (binding && typeof binding.delete === "function") {
      await binding.delete(key);
      return true;
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.warn("⚠️ deleteObjectFromR2 error:", err);
    return false;
  }
}
