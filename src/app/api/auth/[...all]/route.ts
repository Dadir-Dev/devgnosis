import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/** Better Auth HTTP handler, including `/api/auth/callback/:provider`. */
export const { GET, POST } = toNextJsHandler(auth);
