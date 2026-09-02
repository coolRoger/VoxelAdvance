import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { type GroupVariantProps, group } from "styled-system/recipes";

export type GroupProps = JSX.HTMLAttributes<HTMLDivElement> & GroupVariantProps;

export const Group = (props: GroupProps) => {
    const rest = omit(props, "orientation", "attached", "grow", "class");

    return (
        <div
            {...rest}
            class={`${group({
                orientation: props.orientation,
                attached: props.attached,
                grow: props.grow,
            })} ${props.class ?? ""}`}
        />
    );
};
