import { Building2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPhysicians } from "@/api/physicians";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SPECIALTIES, US_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initialFilters = {
  search: "",
  specialty: "",
  state: "",
  affiliation: "",
  npiYear: "",
};

function npiYearParams(value) {
  if (value === "before_2000") return { npiYearMax: 1999 };
  if (value === "2000_2010") return { npiYearMin: 2000, npiYearMax: 2010 };
  if (value === "2010_2020") return { npiYearMin: 2010, npiYearMax: 2020 };
  if (value === "after_2020") return { npiYearMin: 2021 };
  return {};
}

export default function PhysicianDiscovery() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [physicians, setPhysicians] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    async function loadAffiliations() {
      try {
        const data = await getPhysicians();
        setAffiliations([...new Set(data.map((physician) => physician.affiliation))].sort());
      } catch {
        setAffiliations([]);
      }
    }
    loadAffiliations();
  }, []);

  useEffect(() => {
    async function loadPhysicians() {
      setLoading(true);
      setError("");
      try {
        const data = await getPhysicians({
          search: debouncedSearch,
          specialty: filters.specialty,
          state: filters.state,
          affiliation: filters.affiliation,
          ...npiYearParams(filters.npiYear),
        });
        setPhysicians(data);
      } catch {
        setError("Unable to load physicians. Check that the API is running.");
      } finally {
        setLoading(false);
      }
    }
    loadPhysicians();
  }, [debouncedSearch, filters.specialty, filters.state, filters.affiliation, filters.npiYear]);

  const selectedCount = selectedIds.size;
  const selectedLabel = useMemo(
    () => `${physicians.length.toLocaleString()} physicians - ${selectedCount} selected`,
    [physicians.length, selectedCount],
  );

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleSelection(id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Physician discovery</h1>
          <p className="text-sm text-muted-foreground">{selectedLabel}</p>
        </div>
        <Button
          disabled={selectedCount === 0}
          onClick={() => navigate("/campaigns/new", { state: { selectedIds: [...selectedIds] } })}
        >
          Save & Add to Campaign
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            className="pl-10"
            placeholder="Search by physician name"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Select value={filters.specialty} onChange={(event) => updateFilter("specialty", event.target.value)}>
            <SelectOption value="">All specialties</SelectOption>
            {SPECIALTIES.map((specialty) => (
              <SelectOption key={specialty} value={specialty}>
                {specialty}
              </SelectOption>
            ))}
          </Select>
          <Select value={filters.state} onChange={(event) => updateFilter("state", event.target.value)}>
            <SelectOption value="">All states</SelectOption>
            {US_STATES.map((state) => (
              <SelectOption key={state} value={state}>
                {state}
              </SelectOption>
            ))}
          </Select>
          <Select value={filters.affiliation} onChange={(event) => updateFilter("affiliation", event.target.value)}>
            <SelectOption value="">All affiliations</SelectOption>
            {affiliations.map((affiliation) => (
              <SelectOption key={affiliation} value={affiliation}>
                {affiliation}
              </SelectOption>
            ))}
          </Select>
          <Select value={filters.npiYear} onChange={(event) => updateFilter("npiYear", event.target.value)}>
            <SelectOption value="">All NPI years</SelectOption>
            <SelectOption value="before_2000">Before 2000</SelectOption>
            <SelectOption value="2000_2010">2000-2010</SelectOption>
            <SelectOption value="2010_2020">2010-2020</SelectOption>
            <SelectOption value="after_2020">After 2020</SelectOption>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : physicians.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">No physicians match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {physicians.map((physician) => {
            const selected = selectedIds.has(physician.id);
            return (
              <Card
                key={physician.id}
                className={cn("cursor-pointer transition-colors", selected && "ring-1 ring-indigo-500")}
                onClick={() => toggleSelection(physician.id)}
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-medium">
                        {physician.firstName} {physician.lastName}
                      </h2>
                      <p className="text-sm text-muted-foreground">{physician.specialty}</p>
                      <p className="text-xs text-muted-foreground">
                        {physician.city}, {physician.state}
                      </p>
                    </div>
                    <Checkbox
                      checked={selected}
                      readOnly
                      aria-label={`Select ${physician.firstName} ${physician.lastName}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 size={14} />
                    <span>{physician.affiliation}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {physician.boardCertified && <Badge variant="success">Board Certified</Badge>}
                    {physician.acceptingPatients && <Badge variant="info">Accepting Patients</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
