"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { searchTaches, type TacheOption } from "@/lib/actions/taches";
import { Search, X } from "lucide-react";

interface TaskPickerProps {
  selected: TacheOption | null;
  onSelect: (tache: TacheOption | null) => void;
  placeholder?: string;
}

export function TaskPicker({ selected, onSelect, placeholder }: TaskPickerProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<TacheOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await searchTaches(query, 25);
      if (!cancelled) {
        setResults(data);
        setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleSelect(tache: TacheOption) {
    onSelect(tache);
    setOpen(false);
    setQuery("");
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{selected.description}</p>
          <p className="text-muted-foreground">
            {selected.categorie || "—"} ·{" "}
            {selected.heuresStd !== null
              ? `${selected.heuresStd}h`
              : "à devis"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="rounded-full p-1 hover:bg-muted"
          aria-label="Retirer la tâche"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          placeholder={placeholder ?? "Rechercher une tâche (catalogue)…"}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="h-8 pl-8 text-xs"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Recherche…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Aucune tâche trouvée
            </div>
          )}
          {!loading &&
            results.map((tache) => (
              <button
                key={tache.id}
                type="button"
                onClick={() => handleSelect(tache)}
                className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left text-xs last:border-b-0 hover:bg-accent"
              >
                <span className="font-medium">{tache.description}</span>
                <span className="text-muted-foreground">
                  {tache.categorie || "—"} ·{" "}
                  {tache.heuresStd !== null
                    ? `${tache.heuresStd}h`
                    : "à devis"}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
