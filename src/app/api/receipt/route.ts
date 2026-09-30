import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path"); if (!path) return new NextResponse("missing path", { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 300);
  if (error || !data) return new NextResponse("not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
