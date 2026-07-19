import { initializeAnalytics } from "./modules/platform/analytics/client";
if (!window.location.pathname.startsWith("/auth/recovery")) void initializeAnalytics();
