import { NextResponse } from "next/server";
export async function PATCH() { return NextResponse.json({ error: "The verification workflow has been retired. Use the V3 case monitoring workspace." }, { status: 410 }); }
export const POST = PATCH;
