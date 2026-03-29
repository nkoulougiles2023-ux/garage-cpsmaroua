"use client";

import * as React from "react";
import { toggleUserActive } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";

export function ToggleUserButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [loading, setLoading] = React.useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleUserActive(userId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? "..." : isActive ? "Desactiver" : "Activer"}
    </Button>
  );
}
