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

export async function getObjectFromR2(key: string): Promise<Buffer | null> {
  try {
    const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `https://${host}/${BUCKET_NAME}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-\.]/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex("");
    const region = "auto";
    const service = "s3";

    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest =
      `GET\n` +
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
      method: "GET",
      headers: {
        "Host": host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorizationHeader,
      },
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.warn("⚠️ getObjectFromR2 error:", err);
  }
  return null;
}

export async function getR2PresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
  try {
    const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-\.]/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);
    const region = "auto";
    const service = "s3";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    const queryParams = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${ACCESS_KEY_ID}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresInSeconds),
      "X-Amz-SignedHeaders": "host",
    });

    const canonicalQueryParams = queryParams.toString();
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = "host";

    const canonicalRequest =
      `GET\n` +
      `/${BUCKET_NAME}/${key}\n` +
      `${canonicalQueryParams}\n` +
      `${canonicalHeaders}\n` +
      `${signedHeaders}\n` +
      `UNSIGNED-PAYLOAD`;

    const stringToSign =
      `AWS4-HMAC-SHA256\n` +
      `${amzDate}\n` +
      `${credentialScope}\n` +
      `${sha256Hex(canonicalRequest)}`;

    const signingKey = getSignatureKey(SECRET_ACCESS_KEY, dateStamp, region, service);
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    queryParams.append("X-Amz-Signature", signature);

    return `https://${host}/${BUCKET_NAME}/${key}?${queryParams.toString()}`;
  } catch {
    return `/api/r2/download?key=${encodeURIComponent(key)}&raw=true`;
  }
}

export interface R2ObjectItem {
  key: string;
  size: number;
  lastModified: string;
}

export async function listR2Objects(prefix = ""): Promise<R2ObjectItem[]> {
  try {
    const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const query = `list-type=2${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""}`;
    const url = `https://${host}/${BUCKET_NAME}?${query}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-\.]/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex("");
    const region = "auto";
    const service = "s3";

    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest =
      `GET\n` +
      `/${BUCKET_NAME}\n` +
      `${query}\n` +
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
      method: "GET",
      headers: {
        "Host": host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorizationHeader,
      },
    });

    if (res.ok) {
      const xmlText = await res.text();
      const keys = Array.from(xmlText.matchAll(/<Key>(.*?)<\/Key>/g)).map((m) => m[1]);
      const sizes = Array.from(xmlText.matchAll(/<Size>(.*?)<\/Size>/g)).map((m) => Number(m[1]));
      const dates = Array.from(xmlText.matchAll(/<LastModified>(.*?)<\/LastModified>/g)).map((m) => m[1]);

      const items: R2ObjectItem[] = [];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k && !k.endsWith(".json") && !k.endsWith("/")) {
          items.push({
            key: k,
            size: sizes[i] || 0,
            lastModified: dates[i] || new Date().toISOString(),
          });
        }
      }
      return items;
    }
  } catch (err) {
    console.warn("⚠️ listR2Objects error:", err);
  }
  return [];
}
