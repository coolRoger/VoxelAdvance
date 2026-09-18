// A typed, validated client env var, baked into the bundle at build time
// (defaults applied — see env.ts).
import { Title } from "@solidjs/meta";
import { Loading } from "solid-js";
import "@phosphor-icons/web/light";
import "@phosphor-icons/web/bold";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/duotone";
import "@phosphor-icons/web/fill";
import "@phosphor-icons/web/thin";
import "@/index.css";
import { AppShell } from "@/components/common/app-shell";
import { LoadingScreen } from "@/components/common/loading-screen";
import { DBProvider } from "@/contexts/db";
import { GBAProvider } from "@/contexts/gba";
import { Router } from "@/router";

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
