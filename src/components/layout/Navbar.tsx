import Link from "next/link";
import { MoonStar } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-[999] border-b border-white/10 bg-background/70 backdrop-blur-sm">
      <Container>
        <nav className="flex min-h-16 flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center" aria-label="Primary navigation">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan">
              <MoonStar aria-hidden="true" size={20} />
            </span>
            Luna Cosmic */}
            <Image src="/images/logo.png" alt="Luna Cosmic Logo" className="" width={100} height={100} loading="eager" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/" variant="ghost">Home</ButtonLink>
            <ButtonLink href="/calendar" variant="ghost">Calendar</ButtonLink>
            <ButtonLink href="/phases" variant="ghost">Phases</ButtonLink>
            <ButtonLink href="/about" variant="secondary">About</ButtonLink>
          </div>
        </nav>
      </Container>
    </header>
  );
}
