"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClients, createClient } from "@/lib/actions/clients";
import type { ReceptionData } from "./reception-form";

type Client = NonNullable<ReceptionData["client"]>;

type Props = {
  initialData: Client | null;
  onNext: (client: Client) => void;
};

type ClientRecord = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  adresse?: string | null;
};

export function StepClient({ initialData, onNext }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ClientRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
  });

  function handleSearch() {
    startTransition(async () => {
      const clients = await getClients(search);
      setResults(clients as ClientRecord[]);
      setSearched(true);
    });
  }

  function handleSelectClient(c: ClientRecord) {
    onNext({
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      email: c.email ?? undefined,
      adresse: c.adresse ?? undefined,
    });
  }

  function handleCreate() {
    setErrors({});
    startTransition(async () => {
      const result = await createClient(form);
      if (result.error) {
        setErrors(result.error as Record<string, string[]>);
        return;
      }
      const c = result.data!;
      onNext({
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        telephone: c.telephone,
        email: c.email ?? undefined,
        adresse: c.adresse ?? undefined,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Étape 1 : Client</h2>
        <p className="text-sm text-muted-foreground">
          Recherchez un client existant ou créez-en un nouveau.
        </p>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label>Rechercher un client</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Nom, prénom ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            disabled={isPending}
          >
            Rechercher
          </Button>
        </div>
      </div>

      {/* Results */}
      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun client trouvé.
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleSelectClient(c)}
            >
              <div>
                <p className="font-medium">
                  {c.prenom} {c.nom}
                </p>
                <p className="text-sm text-muted-foreground">{c.telephone}</p>
              </div>
              <Button type="button" size="sm" variant="secondary">
                Sélectionner
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* New client */}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Annuler" : "+ Nouveau client"}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Nouveau client</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prenom: e.target.value }))
                }
              />
              {errors.prenom && (
                <p className="text-xs text-destructive">{errors.prenom[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nom: e.target.value }))
                }
              />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                value={form.telephone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, telephone: e.target.value }))
                }
              />
              {errors.telephone && (
                <p className="text-xs text-destructive">
                  {errors.telephone[0]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={form.adresse}
                onChange={(e) =>
                  setForm((p) => ({ ...p, adresse: e.target.value }))
                }
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Création..." : "Créer et continuer"}
          </Button>
        </div>
      )}
    </div>
  );
}
