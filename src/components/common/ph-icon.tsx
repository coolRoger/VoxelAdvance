// import type {} from "@phosphor-icons/web"
import type { PhosphorIcon } from "@phosphor-icons/core";
import type { JSX } from "@solidjs/web";
import { cx } from "styled-system/css";

const iconStyles = {
    REGULAR: "regular",
    THIN: "thin",
    LIGHT: "light",
    BOLD: "bold",
    FILL: "fill",
    DUOTONE: "duotone",
} as const;

type IconStyle = (typeof iconStyles)[keyof typeof iconStyles];

type IconProps = {
    name: PhosphorIcon["name"];
    style?: IconStyle;
    size?: JSX.CSSProperties["font-size"] | number;
    color?: JSX.CSSProperties["color"];
};

const PhIcon = (props: IconProps) => {
    const { name, style = iconStyles.REGULAR, size = "16px", color } = props;
    const fontSize =
        typeof size === "number" || /^-?\d+(\.\d+)?$/.test(size)
            ? `${Number(size) / 4}rem`
            : size;

    return (
        <i
            class={cx(
                style === "regular" && "ph",
                style !== "regular" && `ph-${style}`,
                `ph-${name}`,
            )}
            style={{
                "font-size": fontSize,
                ...(color ? { color } : {}),
            }}
        ></i>
    );
};

export { PhIcon };
