import "@trpc/react-query";
import type { AppRouter } from "../../../server/routers/_app";

declare global {
  interface Window {
    trpc: typeof import("@trpc/react-query")["trpc"];
  }
}

export {};
export type RouterTypes = AppRouter;