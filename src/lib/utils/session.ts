"use server";

import { type CookieOptions, createCookie } from "@remix-run/cookie";
import {
    getRequestEvent,
    type RequestEvent,
    type ResponseStub,
} from "@solidjs/web";

// const session = await useSession<UserSessionData>({
//         password: process.env.SESSION_SECRET as string,
//         name: "user",
//         maxAge: 60 * 60 * 24 * 30,
//         cookie: {
//             secure: false,
//         },
//     });

//     return session;

type SessionParams = {
    password: string;
    name: string;
    maxAge?: number;
    cookie?: Omit<CookieOptions, "name" | "maxAge">;
};

function event(): RequestEvent & { response: ResponseStub } {
    const e = getRequestEvent();
    if (!e) {
        throw new Error(
            "session: no request event — call within a server function, SSR handler, or middleware",
        );
    }
    return e as RequestEvent & { response: ResponseStub };
}

async function useSession<T = any>(params: SessionParams) {
    const {
        password,
        name,
        maxAge = 1000 * 60 * 60 * 24 * 30,
        cookie = {
            sameSite: "Lax",
            httpOnly: false,
            secure: false,
        },
    } = params;

    const secrets = (password ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    if (secrets.length === 0) {
        throw new Error(
            "session: SESSION_SECRET is not set — generate one with `openssl rand -base64 32`",
        );
    }

    const createdCookie = createCookie(name, {
        secrets,
        maxAge,
        ...cookie,
    });

    const raw = await createdCookie.parse(
        event().request.headers.get("cookie"),
    );

    return {
        cookie: createdCookie,
        raw,
        get data() {
            if (!raw) return null;
            try {
                const { data, exp } = JSON.parse(raw) as {
                    data: T;
                    exp: number;
                };
                // Expiry is enforced HERE, server-side: the signed format carries no
                // expiry of its own (the MAC covers the value only), and cookie
                // Max-Age is browser hygiene a client is free to ignore.
                return typeof exp === "number" && Date.now() < exp * 1000
                    ? data
                    : null;
            } catch {
                return null;
            }
        },
        async update(data: T) {
            const exp = Math.floor(Date.now() / 1000) + maxAge;
            event().response.headers.append(
                "set-cookie",
                await createdCookie.serialize(JSON.stringify({ data, exp })),
            );
        },
        async clear() {
            event().response.headers.append(
                "set-cookie",
                await createdCookie.serialize("", { maxAge: 0 }),
            );
        },
    };
}

export { useSession };
