import Moralis from "moralis";

let started = false;

/**
 * Initializes the Moralis SDK once per server instance.
 * Safe to call at the top of every API route — subsequent calls are no-ops.
 * Requires MORALIS_API_KEY to be set in the environment (Vercel dashboard,
 * or local .env for dev). Never hardcode the key here.
 */
export async function initMoralis() {
  if (started) return;

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MORALIS_API_KEY is not set. Add it in Vercel → Settings → Environment Variables."
    );
  }

  await Moralis.start({ apiKey });
  started = true;
}

export default Moralis;
