import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Archive44 database...");

  // Sample wallets
  await prisma.wallet.upsert({
    where: { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" },
    update: {},
    create: {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      ens: "vitalik.eth",
      label: "Vitalik Buterin",
      riskScore: 12,
      balanceEth: 12450,
      txCount: 2847,
      tags: ["founder", "ethereum", "high-profile"],
      aiSummary:
        "High-profile Ethereum founder wallet with extensive DeFi activity and long history dating back to 2015.",
    },
  });

  // Sample tokens
  await prisma.token.upsert({
    where: {
      address_chain: {
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        chain: "ethereum",
      },
    },
    update: {},
    create: {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      chain: "ethereum",
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
      marketCap: 5100000000,
      priceUsd: 8.42,
      holders: 378000,
      riskScore: 15,
      aiSummary:
        "Governance token for the Uniswap protocol. Launched via airdrop in September 2020.",
    },
  });

  // Sample protocols
  await prisma.protocol.upsert({
    where: { slug: "uniswap" },
    update: {},
    create: {
      slug: "uniswap",
      name: "Uniswap",
      description: "Leading decentralized exchange protocol on Ethereum.",
      category: "DEX",
      tvl: 4500000000,
      website: "https://uniswap.org",
      twitter: "Uniswap",
      riskScore: 10,
      aiSummary:
        "Pioneered automated market makers (AMMs). Currently on V3 with concentrated liquidity.",
    },
  });

  // Sample founders
  await prisma.founder.upsert({
    where: { slug: "hayden-adams" },
    update: {},
    create: {
      slug: "hayden-adams",
      name: "Hayden Adams",
      bio: "Founder of Uniswap.",
      twitter: "haydenzadams",
      riskScore: 8,
      aiSummary:
        "Founder of Uniswap. Previously worked at Siemens. Created the first automated market maker DEX.",
    },
  });

  // Sample blog posts
  await prisma.blogPost.upsert({
    where: { slug: "introducing-archive44" },
    update: {},
    create: {
      slug: "introducing-archive44",
      title: "Introducing Archive44: The Memory Layer of Crypto",
      excerpt: "Why we built a permanent, AI-powered knowledge base for blockchain history.",
      content: "Full content here...",
      published: true,
      publishedAt: new Date("2026-07-01"),
      tags: ["Announcement", "Product"],
      author: "Archive44 Team",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
