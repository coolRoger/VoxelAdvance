import type { JSX } from "@solidjs/web";

export type SpanProps = JSX.HTMLAttributes<HTMLSpanElement>;

export const Span = (props: SpanProps) => <span {...props} />;
