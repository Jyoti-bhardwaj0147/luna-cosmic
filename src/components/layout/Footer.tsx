import Image from "next/image";
import Link from "next/link";
import { Moon } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto bg-background/80 text-sm text-muted shadow-[0_-14px_40px_rgba(13,9,24,0.24)] backdrop-blur-sm motion-safe:transition-shadow motion-safe:duration-300">
      <Container>
        <div className="flex flex-col gap-4 border-b border-white/10 py-4 sm:py-1 sm:flex-row items-center sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex w-fit items-center">
            <Image src="/images/logo.png" alt="Luna" width={98} height={40} className="h-auto w-[6.125rem]" />
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 self-center sm:self-end text-xs sm:gap-x-7 sm:text-sm">
            <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Home</Link>
            <Link href="/calendar" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Calendar</Link>
            <Link href="/phases" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Phases</Link>
            {/* <Link href="/about" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">About</Link> */}
          </nav>
        </div>
        <div className="flex flex-col gap-2 py-4 text-xs items-center sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Luna Cosmic</p>
          <p className="group flex items-center gap-2 self-center sm:self-end text-right">
  <Moon
    aria-hidden="true"
    size={14}
    className="text-accent-light motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-rotate-12"
  />
  The moon is always there.
</p>
        </div>
      </Container>
    </footer>
  );
}
