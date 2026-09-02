import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { type SpinnerVariantProps, spinner } from "styled-system/recipes";

export type SpinnerProps = JSX.HTMLAttributes<HTMLSpanElement> &
    SpinnerVariantProps;

export const Spinner = (props: SpinnerProps) => {
    const rest = omit(props, "size", "class");

    return (
        <span
            {...rest}
            class={`${spinner({ size: props.size })} ${props.class ?? ""}`}
        />
    );
};
