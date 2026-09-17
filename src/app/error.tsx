"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center py-16">
      <Container>
        <GlassCard className="mx-auto max-w-xl p-8 text-center">
          <p className="text-sm font-semibold uppercase text-rose">Error</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Something drifted off course</h1>
          <p className="mt-4 text-muted">Try reloading this view.</p>
          <Button className="mt-6" onClick={reset} type="button">Try again</Button>
        </GlassCard>
      </Container>
    </main>
  );
}
