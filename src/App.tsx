// A typed, validated client env var, baked into the bundle at build time
// (defaults applied — see env.ts).
import { Title } from "@solidjs/meta";
import { Loading } from "solid-js";
import "@/index.css";
import { DBProvider } from "@/contexts/db";
import { Router } from "@/router";
import { AppShell } from "./components/common/app-shell";
import { LoadingScreen } from "./components/common/loading-screen";
import { GBAProvider } from "./contexts/gba";

// The app root: the router and the site-wide layout live here. Pages are
// the modules under src/routes.
export default function App() {
    return (
        <Router>
            {(props) => (
                <>
                    <Title>{process.env.VITE_APP_NAME}</Title>
                    <DBProvider>
                        <GBAProvider>
                            <AppShell>
                                <Loading fallback={<LoadingScreen />}>
                                    {props.children}
                                </Loading>
                            </AppShell>
                        </GBAProvider>
                    </DBProvider>
                </>
            )}
        </Router>
    );
}
