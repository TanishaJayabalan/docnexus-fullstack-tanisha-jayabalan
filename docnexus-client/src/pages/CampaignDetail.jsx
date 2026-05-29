import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteCampaign, getCampaign, launchCampaign } from "@/api/campaigns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CAMPAIGN_TYPES } from "@/lib/constants";
import { buildCampaignChartData, formatDate, getCampaignMetrics, statusBadgeVariant } from "@/lib/campaignUtils";
import { cn } from "@/lib/utils";

const mockStatuses = ["Contacted", "Replied", "Bounced"];
const launchSteps = [
  "Validating physician list...",
  "Personalizing message templates...",
  "Queueing outreach sequence...",
  "Campaign launched. Opening dashboard...",
];

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

function physicianStatusVariant(status) {
  if (status === "Replied") return "success";
  if (status === "Bounced") return "danger";
  return "info";
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launchStepIndex, setLaunchStepIndex] = useState(-1);
  const [launchMessage, setLaunchMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCampaign() {
      setLoading(true);
      setError("");
      try {
        setCampaign(await getCampaign(id));
      } catch {
        setError("Unable to load campaign.");
      } finally {
        setLoading(false);
      }
    }
    loadCampaign();
  }, [id]);

  async function handleLaunch() {
    const enrolledCount = campaign?.enrolledPhysicians?.length || campaign?.enrolledPhysicianIds?.length || 0;
    if (enrolledCount === 0) {
      setError("Add at least one physician before launching this campaign.");
      return;
    }

    setLaunching(true);
    setLaunchStepIndex(0);
    setLaunchMessage(launchSteps[0]);
    setError("");
    try {
      const launched = await launchCampaign(id);
      setCampaign(launched);
      for (let index = 1; index < launchSteps.length; index += 1) {
        await wait(650);
        setLaunchStepIndex(index);
        setLaunchMessage(launchSteps[index]);
      }
      await wait(450);
      navigate("/dashboard", { state: { launchedCampaignId: id } });
    } catch {
      setError("Unable to launch campaign.");
      setLaunchStepIndex(-1);
      setLaunchMessage("");
    } finally {
      setLaunching(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${campaign.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await deleteCampaign(id);
      navigate("/campaigns");
    } catch {
      setError("Unable to delete campaign.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28" />
        <Skeleton className="h-80" />
      </section>
    );
  }

  if (!campaign) {
    return (
      <section className="p-6">
        <p className="text-sm text-destructive">{error || "Campaign not found."}</p>
      </section>
    );
  }

  const physicians = campaign.enrolledPhysicians || [];
  const metrics = getCampaignMetrics(campaign);
  const chartData = buildCampaignChartData(campaign);

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-lg font-medium">{campaign.name}</h1>
          <div className="flex gap-2">
            <Badge variant={statusBadgeVariant(campaign.status)}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
            <Badge variant="outline">{CAMPAIGN_TYPES[campaign.type]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Button disabled={launching || physicians.length === 0} onClick={handleLaunch}>
              {launching ? "Launching..." : "Launch"}
            </Button>
          )}
          <Button variant="secondary" disabled={deleting || launching} onClick={handleDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {campaign.status === "draft" && physicians.length === 0 && (
        <p className="text-sm text-muted-foreground">Add at least one physician before launching this campaign.</p>
      )}
      {launching && (
        <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{launchMessage}</span>
          </div>
          <div className="space-y-2">
            {launchSteps.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={cn("h-2 w-2 rounded-full bg-muted-foreground/30", index <= launchStepIndex && "bg-primary")}
                />
                <span className={cn(index <= launchStepIndex && "text-foreground")}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <MetricCard label="Physicians Enrolled" value={physicians.length} />
        <MetricCard label="Messages Sent" value={metrics.messagesSent.toLocaleString()} />
        <MetricCard label="Open Rate" value={`${metrics.openRate}%`} />
        <MetricCard label="Replies" value={metrics.replies.toLocaleString()} />
        <MetricCard label="Meetings Booked" value={metrics.meetingsBooked.toLocaleString()} />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead>Affiliation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {physicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No physicians enrolled in this campaign.
                </TableCell>
              </TableRow>
            ) : (
              physicians.map((physician, index) => {
                const status = mockStatuses[index % mockStatuses.length];
                return (
                  <TableRow key={physician.id}>
                    <TableCell className="font-medium">
                      Dr. {physician.firstName} {physician.lastName}
                    </TableCell>
                    <TableCell>{physician.specialty}</TableCell>
                    <TableCell>{physician.affiliation}</TableCell>
                    <TableCell>
                      <Badge variant={physicianStatusVariant(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                    {formatDate(
                      (() => {
                        // 1. Create a pseudo-random number of days (e.g., between 1 and 14 days)
                        // We use the index or ID to ensure the random date stays consistent on re-render
                        const randomSeed = Math.sin(index + 1) * 10000;
                        const randomDays = Math.floor((randomSeed - Math.floor(randomSeed)) * 14) + 1;
                        
                        // 2. Add those random days to the creation date
                        const randomFutureDate = new Date(
                          new Date(campaign.createdAt).getTime() + randomDays * 86400000
                        );
                        
                        return randomFutureDate.toISOString();
                      })()
                    )}
                  </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-medium">Outreach activity</h2>
          <div className="mt-6 h-52">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Bar dataKey="sent" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
