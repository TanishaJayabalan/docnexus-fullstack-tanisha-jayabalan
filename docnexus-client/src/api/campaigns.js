import { api } from "./client";

export async function createCampaign(payload) {
  const response = await api.post("/campaigns", payload);
  return response.data;
}

export async function getCampaigns() {
  const response = await api.get("/campaigns");
  return response.data;
}

export async function getCampaign(id) {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
}

export async function updateCampaign(id, payload) {
  const response = await api.patch(`/campaigns/${id}`, payload);
  return response.data;
}

export async function launchCampaign(id) {
  const response = await api.patch(`/campaigns/${id}/launch`);
  return response.data;
}

export async function deleteCampaign(id) {
  const response = await api.delete(`/campaigns/${id}`);
  return response.data;
}
