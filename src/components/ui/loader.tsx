import type { JSX } from "@solidjs/web";
import { Match, omit, Show, Switch } from "solid-js";
import { AbsoluteCenter } from "./absolute-center";
import { Span, type SpanProps } from "./span";
import { Spinner } from "./spinner";

export type LoaderProps = SpanProps & {
    visible?: boolean | undefined;
    spinner?: JSX.Element | undefined;
    spinnerPlacement?: "start" | "end" | undefined;
    text?: JSX.Element | undefined;
};

export const Loader = (props: LoaderProps) => {
    const rest = omit(
        props,
        "spinner",
        "spinnerPlacement",
        "children",
        "text",
        "visible",
    );

    const spinner = () =>
        props.spinner ?? (
            <Spinner
                size="inherit"
                style={{
                    "border-width": "0.125em",
                    color: "inherit",
                }}
            />
        );
    const spinnerPlacement = () => props.spinnerPlacement ?? "start";
    const visible = () => props.visible ?? true;

    return (
        <Show
            when={visible()}
            fallback={props.children}
        >
            <Switch>
                <Match when={props.text !== undefined}>
                    <Span
                        style={{ display: "contents" }}
                        {...rest}
                    >
                        <Show when={spinnerPlacement() === "start"}>
                            {spinner()}
                        </Show>
                        {props.text}
                        <Show when={spinnerPlacement() === "end"}>
                            {spinner()}
                        </Show>
                    </Span>
                </Match>
                <Match when={props.spinner !== undefined}>
                    <Span
                        style={{ display: "contents" }}
                        {...rest}
                    >
                        <AbsoluteCenter style={{ display: "inline-flex" }}>
                            {spinner()}
                        </AbsoluteCenter>
                        <Span
                            style={{
                                display: "contents",
                                visibility: "hidden",
                            }}
                        >
                            {props.children}
                        </Span>
                    </Span>
                </Match>
                <Match when={true}>
                    <Span
                        style={{ display: "contents" }}
                        {...rest}
                    >
                        {props.children}
                    </Span>
                </Match>
            </Switch>
        </Show>
    );
};
