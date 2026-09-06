import { css, cx } from "styled-system/css";

const LoadingScreen = () => {
    return (
        <div
            class={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "100%",
            })}
        >
            <div
                class={css({
                    pointerEvents: "none",
                })}
            >
                <span
                    class={cx(
                        "loading",
                        "loading-spinner",
                        "loading-lg",
                        css({
                            color: "var(--color-neutral)",
                        }),
                    )}
                />
            </div>
        </div>
    );
};

export { LoadingScreen };
