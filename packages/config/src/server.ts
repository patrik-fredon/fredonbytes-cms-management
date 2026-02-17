import { configSchema } from "./schema";

export function loadServerConfig(env: Record<string, string | undefined>) {
  return configSchema.parse(env);
}
