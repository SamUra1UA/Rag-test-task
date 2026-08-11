import { NextResponse } from "next/server";

// Liveness/readiness/startup target for the frontend container itself
// (k8s/frontend-deployment.yaml) — unrelated to hooks/useHealth.ts, which
// polls the backend's /health for the sidebar's status dot.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
