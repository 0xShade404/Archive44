import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { createNonce, buildSignMessage } from "@/lib/wallet-nonce";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
  }

  const nonce = createNonce(address);
  return NextResponse.json({ message: buildSignMessage(address, nonce) });
}
