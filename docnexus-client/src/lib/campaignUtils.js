export function renderTemplate(template = "", physician) {
  if (!physician) return template;
  return template
    .replaceAll("{{doctor_name}}", `${physician.firstName} ${physician.lastName}`)
    .replaceAll("{{specialty}}", physician.specialty)
    .replaceAll("{{affiliation}}", physician.affiliation)
    .replaceAll("{{city}}", physician.city);
}

export function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "completed") return "info";
  return "secondary";
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function hashString(value = "") {
  return value.split("").reduce((hash, character) => hash + character.charCodeAt(0), 0);
}

export function getCampaignMetrics(campaign) {
  const enrolled = campaign?.enrolledPhysicianIds?.length || campaign?.enrolledPhysicians?.length || 0;
  const seed = hashString(campaign?.id || campaign?.name || "");
  const activeMultiplier = campaign?.status === "active" ? 2 : 1;
  const messagesSent = enrolled * activeMultiplier * 2 + (seed % 37);
  const openRate = enrolled === 0 ? 0 : 28 + (seed % 24);
  const replies = enrolled === 0 ? 0 : Math.max(1, Math.floor(messagesSent * (0.05 + (seed % 6) / 100)));
  const meetingsBooked = enrolled === 0 ? 0 : Math.floor(replies / 3);

  return {
    enrolled,
    messagesSent,
    openRate,
    replies,
    meetingsBooked,
  };
}

export function buildCampaignChartData(campaign) {
  const seed = hashString(campaign?.id || campaign?.name || "");
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date),
      sent: 12 + ((seed + index * 19) % 89),
    };
  });
}
