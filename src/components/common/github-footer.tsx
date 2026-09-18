import { createSignal, onSettled, Show } from "solid-js";
import { PhIcon } from "@/components/common/ph-icon";

const GITHUB_REPOSITORY = "https://github.com/coolRoger/VoxelAdvance";
const GITHUB_API_URL = "https://api.github.com/repos/coolRoger/VoxelAdvance";

type GitHubRepository = {
    stargazers_count?: number;
};

function formatStarCount(count: number) {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
    }
    return count.toLocaleString("en-US");
}

export function GitHubFooter() {
    const [starCount, setStarCount] = createSignal<number>();

    onSettled(() => {
        const loadStarCount = async () => {
            try {
                const response = await fetch(GITHUB_API_URL, {
                    headers: { Accept: "application/vnd.github+json" },
                });
                if (!response.ok) return;
                const repository = (await response.json()) as GitHubRepository;
                if (typeof repository.stargazers_count === "number") {
                    setStarCount(repository.stargazers_count);
                }
            } catch {
                // GitHub API unavailable should not affect the emulator.
            }
        };

        void loadStarCount();
    });

    return (
        <footer class="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 sm:bottom-6">
            <a
                href={GITHUB_REPOSITORY}
                target="_blank"
                rel="noreferrer"
                class="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-base-100/65 px-4 py-2 text-xs font-semibold text-base-content shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-base-100/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="访问 VoxelAdvance GitHub 项目并 Star"
            >
                <PhIcon
                    name="github-logo"
                    size={5}
                />
                <span>喜欢 Voxel Advance？欢迎给个 Star</span>
                <Show
                    when={starCount()}
                    fallback={<span>★</span>}
                >
                    {(count) => (
                        <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                            <PhIcon
                                name="star"
                                size={4}
                                style="fill"
                            />
                            {formatStarCount(count())}
                        </span>
                    )}
                </Show>
            </a>
        </footer>
    );
}

export default GitHubFooter;
