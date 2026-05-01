import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/types/index";

export const trpc = createTRPCReact<AppRouter>();
