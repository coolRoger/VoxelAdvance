import type { ParentProps } from "solid-js";

const AppShell = (props: ParentProps) => {
    return (
        <main class="relative h-screen w-screen overflow-hidden">
            {props.children}
        </main>
    );
};

export { AppShell };
