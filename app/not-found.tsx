import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        404
      </p>
      <h1 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have moved or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline">
          <Link href="/collection">Browse collection</Link>
        </Button>
      </div>
    </div>
  );
}
