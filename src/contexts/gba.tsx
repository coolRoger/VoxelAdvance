import { createContext, type ParentProps, useContext } from "solid-js";

const GBAContext = createContext();

function GBAProvider(props: ParentProps) {
    return <GBAContext value={props}>{props.children}</GBAContext>;
}

function useGBAContext() {
    return useContext(GBAContext);
}

export { GBAProvider, useGBAContext };
