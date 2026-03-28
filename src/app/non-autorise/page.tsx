import Link from "next/link";

export default function NonAutorisePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="text-muted-foreground">
          Vous n&apos;êtes pas autorisé à accéder à cette page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-2.5 h-8 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
