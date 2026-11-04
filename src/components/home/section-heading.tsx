import { cn } from "@/lib/utils";

/** Red-bar section title used across the home page. */
export function SectionHeading({
  title,
  subtitle,
  action,
  className,
  id,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 id={id} className="border-l-4 border-brand pl-2.5 font-display text-xl font-bold leading-tight md:text-[26px]">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 pl-3.5 text-[13px] text-neutral-700 md:text-[15px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
