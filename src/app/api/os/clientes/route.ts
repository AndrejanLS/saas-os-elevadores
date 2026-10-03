import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const res = await fetch(new URL("/api/os/customers", request.url), {
    headers: { cookie: cookie || "" },
  });
  return NextResponse.json(await res.json());
}

export async function POST(request: Request) {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const body = await request.json();
  const res = await fetch(new URL("/api/os/customers", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookie || "",
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}