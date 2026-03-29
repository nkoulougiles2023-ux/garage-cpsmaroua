"use client";

import * as React from "react";
import { Role } from "@prisma/client";
import { createUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

const ROLES: { label: string; value: Role }[] = [
  { label: "Admin", value: "ADMIN" },
  { label: "Receptionniste", value: "RECEPTIONNISTE" },
  { label: "Magasinier", value: "MAGASINIER" },
  { label: "Controleur", value: "CONTROLEUR" },
  { label: "Client", value: "CLIENT" },
];

export function UserFormDialog() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [prenom, setPrenom] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [telephone, setTelephone] = React.useState("");
  const [role, setRole] = React.useState<Role | "">("");

  function resetForm() {
    setNom("");
    setPrenom("");
    setEmail("");
    setPassword("");
    setTelephone("");
    setRole("");
    setError("");
  }

  async function handleSubmit() {
    if (!nom || !prenom || !email || !password || !telephone || !role) return;
    setLoading(true);
    setError("");
    try {
      const result = await createUser({
        nom,
        prenom,
        email,
        password,
        telephone,
        role: role as Role,
      });
      if (result.error) {
        setError(result.error);
      } else {
        resetForm();
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger render={<Button />}>
        <UserPlus className="mr-2 h-4 w-4" />
        Nouvel utilisateur
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prenom">Prenom</Label>
              <Input
                id="prenom"
                placeholder="Prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.cm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telephone">Telephone</Label>
            <Input
              id="telephone"
              placeholder="+237 6XX XXX XXX"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Choisir un role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!nom || !prenom || !email || !password || !telephone || !role || loading}
          >
            {loading ? "En cours..." : "Creer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
