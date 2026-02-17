export interface SupabaseClientLike {
  auth: {
    signInWithPassword: (input: {
      email: string;
      password: string;
    }) => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
  };
  from: (table: string) => {
    select: (
      columns?: string,
    ) => Promise<{
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    }> & {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
      single: () => Promise<{
        data: Record<string, unknown> | null;
        error: { message: string } | null;
      }>;
    };
    insert: (
      values: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>;
  };
}

function createHttpSupabaseClient(input: {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
}): SupabaseClientLike {
  const baseUrl = input.SUPABASE_URL.replace(/\/$/, "");

  const requestJson = async (
    path: string,
    init: RequestInit,
  ): Promise<{ data: unknown; error: { message: string } | null }> => {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          apikey: input.SUPABASE_KEY,
          Authorization: `Bearer ${input.SUPABASE_KEY}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === "object" && data && "message" in data
            ? String((data as { message: unknown }).message)
            : `${response.status} ${response.statusText}`;
        return { data: null, error: { message } };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: String(error) } };
    }
  };

  return {
    auth: {
      async signInWithPassword(credentials) {
        const { data, error } = await requestJson(
          "/auth/v1/token?grant_type=password",
          {
            method: "POST",
            body: JSON.stringify(credentials),
          },
        );

        if (error) {
          return { data: { user: null }, error };
        }

        const user =
          typeof data === "object" && data && "user" in data
            ? ((data as { user?: { id?: string } }).user ?? null)
            : null;

        return {
          data: {
            user: user?.id ? { id: user.id } : null,
          },
          error: null,
        };
      },
    },
    from(table) {
      const runSelect = async (
        columns = "*",
        filters: Record<string, string> = {},
      ) => {
        const params = new URLSearchParams({ select: columns, ...filters });
        const { data, error } = await requestJson(
          `/rest/v1/${table}?${params.toString()}`,
          { method: "GET" },
        );

        return {
          data: Array.isArray(data) ? data as Array<Record<string, unknown>> : [],
          error,
        };
      };

      return {
        select(columns = "*") {
          const selector = {
            eq(column: string, value: string) {
              return {
                async single() {
                  const result = await runSelect(columns, {
                    [column]: `eq.${value}`,
                    limit: "1",
                  });

                  if (result.error) {
                    return { data: null, error: result.error };
                  }

                  return {
                    data: result.data?.[0] ?? null,
                    error: null,
                  };
                },
              };
            },
            async single() {
              const result = await runSelect(columns, { limit: "1" });

              if (result.error) {
                return { data: null, error: result.error };
              }

              return {
                data: result.data?.[0] ?? null,
                error: null,
              };
            },
            then(onfulfilled: (value: {
              data: Array<Record<string, unknown>> | null;
              error: { message: string } | null;
            }) => unknown, onrejected?: (reason: unknown) => unknown) {
              return runSelect(columns).then(onfulfilled, onrejected);
            },
          };

          return selector as ReturnType<SupabaseClientLike["from"]>["select"];
        },
        async insert(values) {
          const { error } = await requestJson(`/rest/v1/${table}`, {
            method: "POST",
            body: JSON.stringify(values),
            headers: {
              Prefer: "return=minimal",
            },
          });
          return { error };
        },
      };
    },
  };
}

export function createSupabaseClients(cfg: {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}) {
  const publicClient = createHttpSupabaseClient({
    SUPABASE_URL: cfg.SUPABASE_URL,
    SUPABASE_KEY: cfg.SUPABASE_ANON_KEY,
  });

  const adminClient = createHttpSupabaseClient({
    SUPABASE_URL: cfg.SUPABASE_URL,
    SUPABASE_KEY: cfg.SUPABASE_SERVICE_ROLE_KEY,
  });

  return {
    public: publicClient,
    admin: adminClient,
  };
}
