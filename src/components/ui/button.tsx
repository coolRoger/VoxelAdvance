import type { JSX } from "@solidjs/web";
import { createContext, merge, omit, Show, useContext } from "solid-js";
import { type ButtonVariantProps, button } from "styled-system/recipes";
import { Group, type GroupProps } from "./group";
import { Loader } from "./loader";

interface ButtonLoadingProps {
    loading?: boolean | undefined;
    loadingText?: JSX.Element | undefined;
    spinner?: JSX.Element | undefined;
    spinnerPlacement?: "start" | "end" | undefined;
}

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
    ButtonVariantProps &
    ButtonLoadingProps;

export const Button = (props: ButtonProps) => {
    const propsContext = useContext(ButtonPropsContext);
    const merged = merge(propsContext, props);
    const rest = omit(
        merged,
        "loading",
        "loadingText",
        "children",
        "spinner",
        "spinnerPlacement",
        "variant",
        "size",
        "class",
    );

    return (
        <button
            type="button"
            {...rest}
            class={`${button({
                variant: merged.variant,
                size: merged.size,
            })} ${merged.class ?? ""}`}
            disabled={Boolean(merged.loading || rest.disabled)}
        >
            <Show
                when={merged.loading}
                fallback={merged.children}
            >
                <Loader
                    spinner={merged.spinner}
                    text={merged.loadingText}
                    spinnerPlacement={merged.spinnerPlacement}
                >
                    {merged.children}
                </Loader>
            </Show>
        </button>
    );
};

export type ButtonGroupProps = GroupProps & ButtonVariantProps;

export const ButtonGroup = (props: ButtonGroupProps) => {
    const variantProps: ButtonVariantProps = {
        get variant() {
            return props.variant;
        },
        get size() {
            return props.size;
        },
    };
    const groupProps = omit(props, "variant", "size");

    return (
        <ButtonPropsContext value={variantProps}>
            <Group {...groupProps} />
        </ButtonPropsContext>
    );
};

const ButtonPropsContext = createContext<ButtonVariantProps>({});
