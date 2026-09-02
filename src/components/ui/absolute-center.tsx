import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import {
    type AbsoluteCenterVariantProps,
    absoluteCenter,
} from "styled-system/recipes";

export type AbsoluteCenterProps = JSX.HTMLAttributes<HTMLDivElement> &
    AbsoluteCenterVariantProps;

export const AbsoluteCenter = (props: AbsoluteCenterProps) => {
    const rest = omit(props, "axis", "class");

    return (
        <div
            {...rest}
            class={`${absoluteCenter({ axis: props.axis })} ${props.class ?? ""}`}
        />
    );
};
