import { cacheLife } from "next/cache";

/** Current year, prerendered and refreshed daily (Cache Components safe). */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
