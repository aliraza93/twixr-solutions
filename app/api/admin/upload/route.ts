import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/cms/auth";
import { storeAdminFile } from "@/lib/cms/storage";
import {
  asUploadFile,
  assertUploadFile,
  blobErrorMessage,
  safeUploadName,
} from "@/lib/cms/upload";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read the file. Try a smaller image." },
      { status: 400 }
    );
  }

  const file = asUploadFile(formData.get("file"));
  if (!file) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    assertUploadFile(file);
    const result = await storeAdminFile(
      file,
      `studio/${Date.now()}-${safeUploadName(file)}`
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: blobErrorMessage(error) },
      { status: 400 }
    );
  }
}
