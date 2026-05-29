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
  if (!campaign || !campaign.enrolledPhysicians) return [];

  const physicians = campaign.enrolledPhysicians;
  const mockActivityVolumes = [25, 45, 65, 85, 15, 35, 55];

  // 1. Use an object map to bundle matching dates together
  const dateGroups = {};

  physicians.forEach((physician, index) => {
    const randomSeed = Math.sin(index + 1) * 10000;
    const randomDays = Math.floor((randomSeed - Math.floor(randomSeed)) * 14) + 1;

    const randomFutureDate = new Date(
      new Date(campaign.createdAt).getTime() + randomDays * 86400000
    );

    // Format the date to use as our unique key (e.g., "Jun 1")
    const formattedDate = randomFutureDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const volume = mockActivityVolumes[index % mockActivityVolumes.length];

    if (dateGroups[formattedDate]) {
      // If the date already exists, add the volume to it (or keep it separate depending on preference)
      dateGroups[formattedDate].sent += volume;
    } else {
      // Otherwise, create a new record
      dateGroups[formattedDate] = {
        timestamp: randomFutureDate.getTime(),
        date: formattedDate,
        sent: volume,
      };
    }
  });

  // 2. Convert the map back into a sorted array for Recharts
  return Object.values(dateGroups).sort((a, b) => a.timestamp - b.timestamp);
}
