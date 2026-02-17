import { configSchema } from "./schema";

export function loadConfig(env: Record<string, string | undefined>) {
  return configSchema.parse(env);
}
