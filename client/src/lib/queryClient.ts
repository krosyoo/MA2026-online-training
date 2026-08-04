import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** Carries the status and the API's own message so callers can show it. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function throwIfResNotOk(res: Response) {
  if (res.ok) return;

  const text = (await res.text()) || res.statusText;
  // The API answers with { message }, but an infrastructure error (a proxy, a
  // crashed function) can return HTML or plain text instead.
  let message = text;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.message === "string") message = parsed.message;
  } catch {
    message = `${res.status}: ${text}`;
  }

  throw new ApiError(res.status, message);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
