import { Loader2, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateEmail } from "@/api/ai";
import { createCampaign } from "@/api/campaigns";
import { getPhysicians } from "@/api/physicians";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CAMPAIGN_TYPE_OPTIONS, CAMPAIGN_TYPES } from "@/lib/constants";
import { renderTemplate } from "@/lib/campaignUtils";
import { cn } from "@/lib/utils";

const defaultSequences = [
  {
    stepNumber: 1,
    delayDays: 0,
    subjectTemplate: "A quick note for Dr. {{doctor_name}}",
    bodyTemplate: "Dear Dr. {{doctor_name}},\n\nI wanted to reach out given your work in {{specialty}} at {{affiliation}}.",
  },
  {
    stepNumber: 2,
    delayDays: 5,
    subjectTemplate: "Following up",
    bodyTemplate: "Dear Dr. {{doctor_name}},\n\nI wanted to briefly follow up on my note about connecting with physicians in {{city}}.",
  },
];

const launchSteps = [
  "Validating physician list...",
  "Personalizing message templates...",
  "Queueing outreach sequence...",
  "Campaign launched. Opening dashboard...",
];

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function StepIndicator({ step }) {
  const steps = ["Campaign setup", "Sequence builder", "Preview + launch"];
  return (
    <div className="flex items-center">
      {steps.map((label, index) => {
        const number = index + 1;
        const active = step >= number;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs",
                  active && "border-indigo-500 bg-primary text-primary-foreground",
                )}
              >
                {number}
              </span>
              <span className={cn("text-sm text-muted-foreground", step === number && "text-foreground")}>{label}</span>
            </div>
            {index < steps.length - 1 && <div className="mx-4 h-px flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

export default function CampaignBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(() => location.state?.selectedIds || []);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState("cold_outbound");
  const [sequences, setSequences] = useState(defaultSequences);
  const [allPhysicians, setAllPhysicians] = useState([]);
  const [physicianSearch, setPhysicianSearch] = useState("");
  const [previewPhysicianId, setPreviewPhysicianId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launchMessage, setLaunchMessage] = useState("");
  const [launchStepIndex, setLaunchStepIndex] = useState(-1);
  const [aiLoadingStep, setAiLoadingStep] = useState(null);
  const [aiSuccessStep, setAiSuccessStep] = useState(null);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    async function loadPhysicians() {
      setLoading(true);
      try {
        const res = await getPhysicians();
        setAllPhysicians(res.data);
        setPreviewPhysicianId((current) => current || selectedIds[0] || "");
      } catch {
        setError("Unable to load physicians.");
      } finally {
        setLoading(false);
      }
    }
    loadPhysicians();
  }, []);

  const physicians = useMemo(
    () => allPhysicians.filter((physician) => selectedIds.includes(physician.id)),
    [allPhysicians, selectedIds],
  );

  const visiblePhysicians = useMemo(() => {
    const search = physicianSearch.trim().toLowerCase();
    if (!search) return allPhysicians;
    return allPhysicians.filter((physician) =>
      `${physician.firstName} ${physician.lastName} ${physician.specialty} ${physician.affiliation}`
        .toLowerCase()
        .includes(search),
    );
  }, [allPhysicians, physicianSearch]);

  const previewPhysician = useMemo(
    () => physicians.find((physician) => physician.id === previewPhysicianId) || physicians[0],
    [physicians, previewPhysicianId],
  );

  function togglePhysician(id) {
    setSelectedIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((selectedId) => selectedId !== id) : [...current, id];
      if (!exists && !previewPhysicianId) setPreviewPhysicianId(id);
      if (exists && previewPhysicianId === id) setPreviewPhysicianId(next[0] || "");
      return next;
    });
  }

  function personalizeToTemplate(text, physician) {
    if (!physician) return text;
    return text
      .replaceAll(`Dr. ${physician.firstName} ${physician.lastName}`, "Dr. {{doctor_name}}")
      .replaceAll(`${physician.firstName} ${physician.lastName}`, "{{doctor_name}}")
      .replaceAll(`Dr. ${physician.lastName}`, "Dr. {{doctor_name}}")
      .replaceAll(physician.specialty, "{{specialty}}")
      .replaceAll(physician.affiliation, "{{affiliation}}")
      .replaceAll(physician.city, "{{city}}");
  }

  function updateSequence(index, field, value) {
    setSequences((current) =>
      current.map((sequence, sequenceIndex) =>
        sequenceIndex === index ? { ...sequence, [field]: field === "delayDays" ? Number(value) : value } : sequence,
      ),
    );
  }

  async function handleAiGenerate(index) {
    if (!previewPhysician) {
      setAiError("Select at least one physician before generating email copy.");
      return;
    }

    setAiLoadingStep(index);
    setAiSuccessStep(null);
    setAiError("");
    try {
      const generated = await generateEmail({
        physician: previewPhysician,
        stepType: index === 0 ? "initial" : "followup",
        campaignType: type,
      });
      updateSequence(index, "subjectTemplate", personalizeToTemplate(generated.subject, previewPhysician));
      updateSequence(index, "bodyTemplate", personalizeToTemplate(generated.body, previewPhysician));
      setAiSuccessStep(index);
    } catch {
      setAiError("AI generation failed. Check your backend Groq configuration and try again.");
    } finally {
      setAiLoadingStep(null);
    }
  }

  async function saveCampaign(status) {
    if (!name.trim()) {
      setError("Campaign name is required.");
      setStep(1);
      return;
    }
    if (selectedIds.length === 0) {
      setError("Select at least one physician before saving or launching.");
      setStep(1);
      return;
    }

    setSaving(true);
    setError("");
    setLaunchStepIndex(status === "active" ? 0 : -1);
    setLaunchMessage(status === "active" ? launchSteps[0] : "");
    try {
      const campaign = await createCampaign({
        name,
        type,
        status,
        sequences,
        enrolledPhysicianIds: selectedIds,
      });
      if (status === "active") {
        for (let index = 1; index < launchSteps.length; index += 1) {
          await wait(650);
          setLaunchStepIndex(index);
          setLaunchMessage(launchSteps[index]);
        }
        await wait(450);
        navigate("/dashboard", { state: { launchedCampaignId: campaign.id } });
      } else {
        navigate("/campaigns");
      }
    } catch {
      setError("Unable to save campaign. Check that the API is running.");
      setLaunchMessage("");
      setLaunchStepIndex(-1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Campaign builder</h1>
        <p className="text-sm text-muted-foreground">Create an outreach sequence for selected physicians.</p>
      </div>

      <StepIndicator step={step} />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Q3 referral outreach" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign type</label>
              <Select value={type} onChange={(event) => setType(event.target.value)}>
                {CAMPAIGN_TYPE_OPTIONS.map((option) => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Enrolled physicians</label>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm">{selectedIds.length} physicians selected</p>
                {physicians.length > 0 && (
                  <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Selected physicians</p>
                    <div className="mt-2 max-h-28 space-y-2 overflow-y-auto">
                      {physicians.map((physician) => (
                        <div key={physician.id} className="flex items-center justify-between gap-3 text-sm">
                          <span>
                            Dr. {physician.firstName} {physician.lastName}
                            <span className="block text-xs text-muted-foreground">{physician.specialty}</span>
                          </span>
                          <Button variant="ghost" size="sm" type="button" onClick={() => togglePhysician(physician.id)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    className="pl-10"
                    placeholder="Search and add physicians"
                    value={physicianSearch}
                    onChange={(event) => setPhysicianSearch(event.target.value)}
                  />
                </div>
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                  {loading ? (
                    <Skeleton className="h-20" />
                  ) : visiblePhysicians.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No physicians match your search.</p>
                  ) : (
                    visiblePhysicians.map((physician) => (
                      <button
                        key={physician.id}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                        type="button"
                        onClick={() => togglePhysician(physician.id)}
                      >
                        <Checkbox checked={selectedIds.includes(physician.id)} readOnly />
                        <span>
                          Dr. {physician.firstName} {physician.lastName}
                          <span className="block text-xs text-muted-foreground">
                            {physician.specialty} - {physician.affiliation}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!name.trim() || selectedIds.length === 0}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {sequences.map((sequence, index) => {
            const isLoading = aiLoadingStep === index;
            return (
              <Card key={sequence.stepNumber}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>{index === 0 ? "Step 1 - Initial email" : "Step 2 - Follow-up email"}</CardTitle>
                    <Button variant="ghost" onClick={() => handleAiGenerate(index)} disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                      Generate with AI
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {index === 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Send after X days if no reply</label>
                      <Input
                        type="number"
                        min="1"
                        value={sequence.delayDays}
                        onChange={(event) => updateSequence(index, "delayDays", event.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={sequence.subjectTemplate}
                      onChange={(event) => updateSequence(index, "subjectTemplate", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email body</label>
                    <Textarea
                      rows={8}
                      value={sequence.bodyTemplate}
                      onChange={(event) => updateSequence(index, "bodyTemplate", event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available variables: {"{{doctor_name}}"} {"{{specialty}}"} {"{{affiliation}}"} {"{{city}}"}
                    </p>
                    {aiSuccessStep === index && (
                      <p className="text-xs text-muted-foreground">
                        AI draft added. Template variables were preserved so every enrolled physician gets personalized copy.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {aiError && <p className="text-sm text-destructive">{aiError}</p>}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={previewPhysicianId} onChange={(event) => setPreviewPhysicianId(event.target.value)}>
                {physicians.length === 0 && <SelectOption value="">No physicians selected</SelectOption>}
                {physicians.map((physician) => (
                  <SelectOption key={physician.id} value={physician.id}>
                    Preview as: Dr. {physician.firstName} {physician.lastName}
                  </SelectOption>
                ))}
              </Select>
              <div className="rounded-lg border border-border bg-background p-6">
                <p className="text-xs text-muted-foreground">Subject</p>
                <h2 className="mt-1 text-sm font-medium">{renderTemplate(sequences[0].subjectTemplate, previewPhysician)}</h2>
                <div className="mt-6 whitespace-pre-line text-sm text-foreground">
                  {renderTemplate(sequences[0].bodyTemplate, previewPhysician)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Launch summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-right">{name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{CAMPAIGN_TYPES[type]}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Physicians enrolled</dt>
                  <dd>{selectedIds.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Steps</dt>
                  <dd>{sequences.length}</dd>
                </div>
              </dl>
              {launchMessage && (
                <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>{launchMessage}</span>
                  </div>
                  <div className="space-y-2">
                    {launchSteps.map((label, index) => (
                      <div key={label} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full bg-muted-foreground/30",
                            index <= launchStepIndex && "bg-primary",
                          )}
                        />
                        <span className={cn(index <= launchStepIndex && "text-foreground")}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Button className="w-full" variant="secondary" disabled={saving} onClick={() => saveCampaign("draft")}>
                  Save as Draft
                </Button>
                <Button className="w-full" disabled={saving} onClick={() => saveCampaign("active")}>
                  {saving && launchMessage ? "Launching..." : "Launch Campaign"}
                </Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
