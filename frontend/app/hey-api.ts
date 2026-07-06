import type { CreateClientConfig } from "./client/client.gen";

function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    throw new Error("VITE_API_URL is not set");
  }

  return apiBaseUrl;
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...(config ?? {}),
  baseUrl: getApiBaseUrl(),
});
