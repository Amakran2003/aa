import type { SVGProps } from "react";

export type MarkName = "diamond" | "star" | "factory" | "pin" | "shield";

const shared = {
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  className: "h-4 w-4 shrink-0 text-signal",
};

function Mark({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...shared} {...props}>
      {children}
    </svg>
  );
}

const paths: Record<MarkName, string> = {
  diamond: "M12 2.2 3.5 9.4 12 21.8 20.5 9.4 12 2.2Z",
  star: "m12 2.8 2.5 5.6 6.1.7-4.6 4.1 1.3 6.1L12 16.4 6.7 19.3 8 13.2 3.4 9.1l6.1-.7L12 2.8Z",
  factory:
    "M3 20.5V9.2l5.5 2.8V9.2L14 12V8.2l7 3.2v9.1H3Zm2.2-2.2h2.1v-2.2H5.2v2.2Zm0-4h2.1V12H5.2v2.3Zm4.2 4h2.1v-2.2H9.4v2.2Zm0-4h2.1V12H9.4v2.3Zm4.3 4H16v-2.2h-2.3v2.2Zm0-4H16V12h-2.3v2.3Zm4.2 4h2.1v-2.2H18v2.2Zm0-4h2.1V12H18v2.3Z",
  pin: "M12 2.2a7 7 0 0 0-7 7c0 5.3 7 12.6 7 12.6s7-7.3 7-12.6a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z",
  shield:
    "M12 2.2 4.2 5.6v6.1c0 4.9 3.3 8.4 7.8 10.1 4.5-1.7 7.8-5.2 7.8-10.1V5.6L12 2.2Zm-1.1 13.1-3-2.9 1.4-1.4 1.6 1.6 3.7-3.6 1.4 1.4-5.1 4.9Z",
};

export function MarkIcon({ name }: { name: MarkName }) {
  return (
    <Mark>
      <path fill="currentColor" d={paths[name]} />
    </Mark>
  );
}
