"use server";

import { useSession } from "@/lib/utils/session";

export type UserSessionData = Partial<{
    id: string;
}>;

export async function useUserSession() {
    const session = await useSession<UserSessionData>({
        password: process.env.SESSION_SECRET as string,
        name: "user",
        maxAge: 60 * 60 * 24 * 30,
        cookie: {
            secure: false,
        },
    });

    return session;
}

export async function getUserSession() {
    const session = await useUserSession();
    return session.data;
}

export async function setUserSession(data: UserSessionData) {
    const session = await useUserSession();
    await session.update(data);
}

export async function clearUserSession() {
    const session = await useUserSession();
    await session.clear();
}
