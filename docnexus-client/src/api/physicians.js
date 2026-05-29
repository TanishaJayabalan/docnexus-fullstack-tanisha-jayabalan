import { api } from "./client";

export async function getPhysicians(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
  const response = await api.get("/physicians", { params: cleaned });
  return response.data;
}
