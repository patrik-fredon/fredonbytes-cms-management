import { loadClientConfig } from "./client";
import { loadServerConfig } from "./server";

export function loadConfig(env: Record<string, string | undefined>) {
  return loadServerConfig(env);
}

export { loadClientConfig, loadServerConfig };
