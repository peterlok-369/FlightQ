const RAPID_HOST = "google-flights2.p.rapidapi.com";

const ENDPOINTS = new Set(["searchFlights", "getNextFlights"]);

type Config = {
  path: string;
};

type Context = Record<string, never>;

type ProxyBody = {
  endpoint?: string;
  params?: Record<string, string>;
};

declare const Netlify: {
  env: {
    get(name: string): string | undefined;
  };
};

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function readSecret(name: string) {
  return Netlify.env.get(name)?.trim() || "";
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const rapidKey = readSecret("RAPIDAPI_KEY");
  if (!rapidKey) {
    return json({ error: "Server missing RAPIDAPI_KEY" }, { status: 500 });
  }

  const accessPin = readSecret("FLIGHTQ_ACCESS_PIN");
  if (accessPin && req.headers.get("x-flightq-pin") !== accessPin) {
    return json({ error: "Invalid FlightQ access PIN" }, { status: 401 });
  }

  let body: ProxyBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const endpoint = body.endpoint || "";
  if (!ENDPOINTS.has(endpoint)) {
    return json({ error: "Unsupported RapidAPI endpoint" }, { status: 400 });
  }

  const params = new URLSearchParams(body.params || {});
  const upstream = await fetch(
    `https://${RAPID_HOST}/api/v1/${endpoint}?${params}`,
    {
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": RAPID_HOST,
        "Content-Type": "application/json",
      },
    },
  );

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") || "application/json",
    },
  });
};

export const config: Config = {
  path: "/api/rapidapi",
};
