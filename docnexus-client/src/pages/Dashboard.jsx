import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCampaigns } from "@/api/campaigns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CAMPAIGN_TYPES } from "@/lib/constants";
import { formatDate, getCampaignMetrics, statusBadgeVariant } from "@/lib/campaignUtils";

function MetricCard({ label, value }) {
  return (
    <Card className="bg-muted/40">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const launchedCampaignId = location.state?.launchedCampaignId;
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      setError("");
      try {
        setCampaigns(await getCampaigns());
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const enrolled = useMemo(
    () =>
      campaigns
        .filter((campaign) => campaign.status === "active")
        .reduce((sum, campaign) => sum + (campaign.enrolledPhysicianIds?.length || 0), 0),
    [campaigns],
  );
  const totals = useMemo(() => {
    const metrics = campaigns.map(getCampaignMetrics);
    const messagesSent = metrics.reduce((sum, metric) => sum + metric.messagesSent, 0);
    const replies = metrics.reduce((sum, metric) => sum + metric.replies, 0);
    const meetingsBooked = metrics.reduce((sum, metric) => sum + metric.meetingsBooked, 0);
    const openRate =
      metrics.length === 0 ? 0 : Math.round(metrics.reduce((sum, metric) => sum + metric.openRate, 0) / metrics.length);
    return { messagesSent, replies, meetingsBooked, openRate };
  }, [campaigns]);
  const launchedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === launchedCampaignId),
    [campaigns, launchedCampaignId],
  );
  const latestActiveCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.status === "active"),
    [campaigns],
  );
  const featuredCampaign = launchedCampaign || latestActiveCampaign;
  const featuredMetrics = featuredCampaign ? getCampaignMetrics(featuredCampaign) : null;

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Campaign performance across active outreach.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {featuredCampaign && (
        <Card className="border-indigo-500 bg-muted/40">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {launchedCampaign ? "Launch complete" : "Latest active campaign"}
              </p>
              <h2 className="mt-1 text-sm font-medium">{featuredCampaign.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {featuredMetrics.enrolled} physicians enrolled, {featuredMetrics.messagesSent} messages queued,{" "}
                {featuredMetrics.openRate}% projected open rate.
              </p>
            </div>
            <Button asChild>
              <Link to={`/campaigns/${featuredCampaign.id}`}>View details</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <MetricCard label="Physicians Enrolled" value={loading ? "-" : enrolled.toLocaleString()} />
        <MetricCard label="Messages Sent" value={loading ? "-" : totals.messagesSent.toLocaleString()} />
        <MetricCard label="Open Rate" value={loading ? "-" : `${totals.openRate}%`} />
        <MetricCard label="Replies" value={loading ? "-" : totals.replies.toLocaleString()} />
        <MetricCard label="Meetings Booked" value={loading ? "-" : totals.meetingsBooked.toLocaleString()} />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Physicians enrolled</TableHead>
              <TableHead>Created date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {!loading && campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No campaigns yet. Start by selecting physicians.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              campaigns.map((campaign) => (
                <TableRow key={campaign.id} className={campaign.id === launchedCampaignId ? "bg-muted/60" : ""}>
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
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
