import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-2", align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm text-zinc-600 md:text-base">{description}</p>
      ) : null}
    </div>
  );
}
