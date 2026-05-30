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
  npiYearMin: "",
  npiYearMax: "",
};


export default function PhysicianDiscovery() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [physicians, setPhysicians] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    async function loadAffiliations() {
      try {
        const data = await getPhysicians();
        setAffiliations([...new Set(data.data.map((physician) => physician.affiliation))].sort());
      } catch {
        setAffiliations([]);
      }
    }
    loadAffiliations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectAllAcrossPages(false);
  }, [debouncedSearch, filters.specialty, filters.state, filters.affiliation, filters.npiYearMin, filters.npiYearMax]);

  useEffect(() => {
    async function loadPhysicians() {
      setLoading(true);
      setError("");
      try {
        const res = await getPhysicians({
          search: debouncedSearch,
          specialty: filters.specialty,
          state: filters.state,
          affiliation: filters.affiliation,
          npiYearMin: filters.npiYearMin,
          npiYearMax: filters.npiYearMax,
          page: currentPage,
          limit: 12,
        });
        setPhysicians(res.data);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
      } catch {
        setError("Unable to load physicians. Check that the API is running.");
      } finally {
        setLoading(false);
      }
    }
    loadPhysicians();
  }, [debouncedSearch, filters.specialty, filters.state, filters.affiliation, filters.npiYearMin, filters.npiYearMax, currentPage]);

  const selectedCount = selectedIds.size;
  const selectedLabel = useMemo(
  () => `${totalCount.toLocaleString()} physicians - ${selectedCount} selected`,
  [totalCount, selectedCount],
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

async function toggleSelectAll() {
  if (selectAllAcrossPages) {
    // deselect everything
    setSelectedIds(new Set());
    setSelectAllAcrossPages(false);
    return;
  }

  if (physicians.every((p) => selectedIds.has(p.id))) {
    // current page all selected → deselect current page only
    setSelectedIds((current) => {
      const next = new Set(current);
      physicians.forEach((p) => next.delete(p.id));
      return next;
    });
  } else {
    // select current page
    setSelectedIds((current) => {
      const next = new Set(current);
      physicians.forEach((p) => next.add(p.id));
      return next;
    });
  }
}

async function selectAllAcross() {
  try {
    const res = await getPhysicians({
      search: debouncedSearch,
      specialty: filters.specialty,
      state: filters.state,
      affiliation: filters.affiliation,
      npiYearMin: filters.npiYearMin,
      npiYearMax: filters.npiYearMax,
      page: 1,
      limit: 99999,
    });
    setSelectedIds(new Set(res.data.map((p) => p.id)));
    setSelectAllAcrossPages(true);
  } catch {
    setError("Unable to select all physicians.");
  }
}

const allCurrentPageSelected = physicians.length > 0 && physicians.every((p) => selectedIds.has(p.id));

  return (
    <section className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-lg font-medium">Physician discovery</h1>
        <p className="text-sm text-muted-foreground">{selectedLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={toggleSelectAll}>
          {selectAllAcrossPages ? "Deselect All" : allCurrentPageSelected ? "Deselect Page" : "Select Page"}
        </Button>
        <Button
          disabled={selectedCount === 0}
          onClick={() => navigate("/campaigns/new", { state: { selectedIds: [...selectedIds] } })}
        >
          Save & Add to Campaign
        </Button>
      </div>
    </div>

{allCurrentPageSelected && !selectAllAcrossPages && totalPages > 1 && (
  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-2 text-sm">
    <span className="text-muted-foreground">All 12 on this page selected.</span>
    <button className="text-indigo-500 underline-offset-2 hover:underline" onClick={selectAllAcross}>
      Select all {totalCount.toLocaleString()} physicians
    </button>
  </div>
)}

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
          <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">NPI Year</span>
          <Input type="number" placeholder="From" value={filters.npiYearMin} onChange={(e) => updateFilter("npiYearMin", e.target.value)} className="w-28" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="number" placeholder="To" value={filters.npiYearMax} onChange={(e) => updateFilter("npiYearMax", e.target.value)} className="w-28" />
          </div>
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
      {totalPages > 1 && (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    )}
    </section>
  );
}
