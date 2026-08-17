import { cn } from "@/lib/utils";

type ConnectorLineProps = {
  className?: string;
  /** Render the lime head as a sibling so it can stack above tiles. */
  detachDot?: boolean;
};

export function ConnectorLine({ className, detachDot = false }: ConnectorLineProps) {
  const dot = <div className="connector-line__dot" aria-hidden />;

  return (
    <>
      <div className={cn("connector-line", className)} aria-hidden>
        <div className="connector-line__fill" />
        {detachDot ? null : dot}
      </div>
      {detachDot ? dot : null}
    </>
  );
}
