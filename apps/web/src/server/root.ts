import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { billingRouter } from "./routers/billing";
import { queryRouter } from "./routers/query";

export const appRouter = router({
  auth: authRouter,
  billing: billingRouter,
  query: queryRouter,
});

export type AppRouter = typeof appRouter;
