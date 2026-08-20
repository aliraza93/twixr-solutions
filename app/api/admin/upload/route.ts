import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/cms/auth";
import { storeAdminFile } from "@/lib/cms/storage";
import { asUploadFile, assertUploadFile, safeUploadName } from "@/lib/cms/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = asUploadFile(form.get("file"));
  if (!file) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    assertUploadFile(file);
    const result = await storeAdminFile(file, `studio/${safeUploadName(file)}`);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message.slice(0, 220) }, { status: 400 });
  }
}
