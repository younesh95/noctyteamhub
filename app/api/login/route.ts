import { validateConnection } from "../../../desktop/connection-policy.mjs";
export async function POST(request: Request) {
  try {
    const connection = validateConnection({
      supabaseUrl: process.env.SUPABASE_URL,
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    });
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 24 ||
      password.length > 256
    )
      return Response.json(
        { error: "Identifiants invalides." },
        { status: 400 },
      );
    const result = await fetch(
      connection.supabaseUrl + "/functions/v1/username-login",
      {
        method: "POST",
        redirect: "error",
        headers: {
          apikey: connection.publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
    );
    return Response.json(await result.json(), {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Service de connexion indisponible. Vérifiez la configuration du serveur.",
      },
      { status: 503 },
    );
  }
}
