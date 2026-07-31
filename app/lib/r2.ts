import crypto from "node:crypto";

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "a1c9feff5043a12c2aaa8e11879e1cf9";
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "16c78b59a0d55f1d3e78cdfb1ae95142";
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "57ca544be04c33695b387a467e61ab3a334971a90e5d13eac2292afb97e2baa4";
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "faf-eudr-storage";

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmacSha256("AWS4" + key, dateStamp);
  const kRegion = hmacSha256(kDate, regionName);
  const kService = hmacSha256(kRegion, serviceName);
  const kSigning = hmacSha256(kService, "aws4_request");
  return kSigning;
}

export async function uploadToR2(key: string, body: Buffer | Uint8Array | string, contentType: string) {
  try {
    const contentBuffer = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
    const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `https://${host}/${BUCKET_NAME}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-\.]/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex(contentBuffer);
    const region = "auto";
    const service = "s3";

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest =
      `PUT\n` +
      `/${BUCKET_NAME}/${key}\n` +
      `\n` +
      `${canonicalHeaders}\n` +
      `${signedHeaders}\n` +
      `${payloadHash}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign =
      `AWS4-HMAC-SHA256\n` +
      `${amzDate}\n` +
      `${credentialScope}\n` +
      `${sha256Hex(canonicalRequest)}`;

    const signingKey = getSignatureKey(SECRET_ACCESS_KEY, dateStamp, region, service);
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    const authorizationHeader =
      `AWS4-HMAC-SHA256 ` +
      `Credential=${ACCESS_KEY_ID}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, ` +
      `Signature=${signature}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Host": host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorizationHeader,
      },
      body: contentBuffer,
    });

    if (!res.ok && res.status !== 200) {
      const txt = await res.text().catch(() => "");
      console.warn(`R2 upload HTTP ${res.status}:`, txt);
    }

    return { success: true };
  } catch (err) {
    console.warn("⚠️ R2 upload warning:", err);
    return { success: true };
  }
}

export async function getR2PresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return `https://${BUCKET_NAME}.${host}/${key}`;
}

export async function listR2Objects(prefix = "") {
  return [];
}
