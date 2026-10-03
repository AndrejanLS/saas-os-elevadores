import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const { id } = await params;
  const res = await fetch(new URL(`/api/os/customers/${id}`, request.url), {
    headers: { cookie: cookie || "" },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const { id } = await params;
  const body = await request.json();
  const res = await fetch(new URL(`/api/os/customers/${id}`, request.url), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie: cookie || "",
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const { id } = await params;
  const res = await fetch(new URL(`/api/os/customers/${id}`, request.url), {
    method: "DELETE",
    headers: { cookie: cookie || "" },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}