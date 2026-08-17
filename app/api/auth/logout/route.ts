import { SESSION_COOKIE_NAME } from "@/app/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST() {
  const clearCookieHeader = `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  return Response.json(
    { success: true },
    {
      headers: {
        ...corsHeaders,
        "Set-Cookie": clearCookieHeader,
      },
    }
  );
}
