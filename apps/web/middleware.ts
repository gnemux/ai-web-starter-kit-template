import type { NextRequest } from "next/server";
import { updateSession } from "@/modules/platform/supabase/proxy";

export async function middleware(request: NextRequest) { return updateSession(request); }
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs"
};
