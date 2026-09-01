import type { RouteDefinition } from "@solidjs/router";

// The preload starts these fetches as navigation begins — and it doubles as
// the page's single-flight manifest: after a mutation, the server reruns it
// to put the refreshed data on the action response itself.
export const route = {
    preload: () => {},
} satisfies RouteDefinition;

export default function Home() {
    return (
        <main>
            <p>Home</p>
        </main>
    );
}
