import { serverConfigSchema } from "./schema";

export function loadServerConfig(env: Record<string, string | undefined>) {
  return serverConfigSchema.parse(env);
}
