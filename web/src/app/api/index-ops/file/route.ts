import { IncomingForm } from "formidable";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import os from "os";

export function POST(request: NextApiRequest) {
  const form = new IncomingForm({
    uploadDir: os.tmpdir(),
  });
  form.parse(request, async (err, fields, files) => {
    if (err) throw err;
    console.log({ fields, files });
  });
  return NextResponse.json({ hello: "world" });
}
