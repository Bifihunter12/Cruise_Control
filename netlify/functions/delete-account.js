// ── Momentum — Delete account function ─────────────────────────────────────
// POST /.netlify/functions/delete-account
// Header: Authorization: Bearer <supabase access token>
//
// Permanently deletes the caller's Supabase auth user and their saved app
// data. Requires the SUPABASE_SERVICE_ROLE_KEY environment variable (Site
// settings → Environment variables in the Netlify dashboard) — this key has
// full admin rights over the Supabase project and must never be exposed to
// the browser, which is why this has to run server-side.
//
// The access token in the Authorization header is what proves the caller is
// the account owner: it's verified against Supabase before anything is
// deleted, and only the uid that token resolves to is touched.

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://jfhlsdkqtieriixudzko.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function ok(body)          { return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(body) }; }
function err(status, msg)  { return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: msg }) }; }

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return err(405, "Method Not Allowed");

  if (!SERVICE_ROLE_KEY) {
    console.error("delete-account: SUPABASE_SERVICE_ROLE_KEY is not set");
    return err(500, "Account deletion isn't configured on the server yet.");
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken) return err(401, "Missing access token");

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Resolve the token to a real, currently-valid user — this is what stops
  // anyone from deleting an account that isn't their own.
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return err(401, "Invalid or expired session");
  }
  const uid = userData.user.id;

  // Best-effort: remove their saved app data, then the auth account itself.
  try {
    await admin.from("user_data").delete().eq("user_id", uid);
  } catch (e) {
    console.warn("delete-account: failed to delete user_data row for", uid, e);
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) {
    console.error("delete-account: auth.admin.deleteUser failed for", uid, delErr);
    return err(500, "Could not delete account: " + delErr.message);
  }

  return ok({ ok: true });
};
