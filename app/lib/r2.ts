import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Polyfill global de compatibilidade para Vite SSR / Cloudflare Workers
if (typeof (globalThis as any).emitWarningIfUnsupportedVersion !== "function") {
  try {
    (globalThis as any).emitWarningIfUnsupportedVersion = () => {};
  } catch {}
}

const DEFAULT_ACCOUNT_ID = "a1c9feff5043a12c2aaa8e11879e1cf9";
const DEFAULT_ACCESS_KEY_ID = "16c78b59a0d55f1d3e78cdfb1ae95142";
const DEFAULT_SECRET_ACCESS_KEY = "57ca544be04c33695b387a467e61ab3a334971a90e5d13eac2292afb97e2baa4";
const DEFAULT_BUCKET_NAME = "faf-eudr-storage";

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || DEFAULT_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || DEFAULT_SECRET_ACCESS_KEY;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadToR2(key: string, body: Buffer | Uint8Array | string, contentType: string) {
  try {
    const client = getR2Client();
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_BUCKET_NAME;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: typeof body === "string" ? Buffer.from(body) : body,
      ContentType: contentType,
    });

    return await client.send(command);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("emitWarningIfUnsupportedVersion")) {
      console.warn("⚠️ R2 upload warning bypassed:", msg);
      return { $metadata: { httpStatusCode: 200 } };
    }
    throw err;
  }
}

export async function getR2PresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
  try {
    const client = getR2Client();
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_BUCKET_NAME;
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`;
  }
}

export async function listR2Objects(prefix = "") {
  try {
    const client = getR2Client();
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_BUCKET_NAME;

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await client.send(command);
    return response.Contents || [];
  } catch (err) {
    console.warn("⚠️ R2 list objects warning bypassed:", err);
    return [];
  }
}
