import { Link } from "react-router-dom";
import { deleteCampaign, getCampaigns } from "@/api/campaigns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CAMPAIGN_TYPES } from "@/lib/constants";
import { formatDate, statusBadgeVariant } from "@/lib/campaignUtils";
import { useEffect, useState } from "react";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      setError("");
      try {
        setCampaigns(await getCampaigns());
      } catch {
        setError("Unable to load campaigns. Check that the API is running.");
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  async function handleDelete(campaign) {
    const confirmed = window.confirm(`Delete "${campaign.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(campaign.id);
    setError("");
    try {
      await deleteCampaign(campaign.id);
      setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
    } catch {
      setError("Unable to delete campaign.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage outreach drafts and launched campaigns.</p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new">New campaign</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Physicians enrolled</TableHead>
              <TableHead>Created date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {!loading && campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No campaigns yet. Start by selecting physicians.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" to={`/campaigns/${campaign.id}`}>
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CAMPAIGN_TYPES[campaign.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.enrolledPhysicianIds?.length || 0}</TableCell>
                  <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === campaign.id}
                      onClick={() => handleDelete(campaign)}
                    >
                      {deletingId === campaign.id ? "Deleting..." : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
