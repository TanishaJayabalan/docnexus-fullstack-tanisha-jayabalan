import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import CampaignBuilder from "@/pages/CampaignBuilder";
import CampaignDetail from "@/pages/CampaignDetail";
import Campaigns from "@/pages/Campaigns";
import Dashboard from "@/pages/Dashboard";
import PhysicianDiscovery from "@/pages/PhysicianDiscovery";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<PhysicianDiscovery />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<CampaignBuilder />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
