import { ViewTransition } from "react";

/**
 * A template remounts on every navigation (unlike a layout, which persists),
 * so the enter/exit animations below actually fire on route changes. The
 * header, announcement bar and footer live in the layout and stay put.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
