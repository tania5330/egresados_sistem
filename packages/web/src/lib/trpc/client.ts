import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { getBaseUrl } from "@/lib/utils";
import type { AppRouter } from "@/types/index";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.duration > 100),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
