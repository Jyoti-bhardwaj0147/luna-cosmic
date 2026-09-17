import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center py-16">
      <Container>
        <GlassCard className="mx-auto max-w-xl p-8 text-center">
          <p className="text-sm font-semibold uppercase text-cyan">404</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-4 text-muted">This route is outside the current lunar chart.</p>
          <Link className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-violet px-4 text-sm font-semibold text-white hover:bg-violet-strong" href="/">
            Return home
          </Link>
        </GlassCard>
      </Container>
    </main>
  );
}
