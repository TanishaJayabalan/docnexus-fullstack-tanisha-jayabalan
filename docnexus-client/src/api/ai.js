import { api } from "./client";

export async function generateEmail(payload) {
  const response = await api.post("/ai/generate-email", payload);
  return response.data;
}
