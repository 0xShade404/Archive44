import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const posts = [
  {
    slug: "introducing-archive44",
    title: "Introducing Archive44: The Memory Layer of Crypto",
    excerpt: "Why we built a permanent, AI-powered knowledge base for blockchain history.",
    date: "2026-07-01",
    tags: ["Announcement", "Product"],
  },
  {
    slug: "crypto-native-payments",
    title: "Why We Only Accept Crypto Payments",
    excerpt: "Building a truly crypto-native SaaS without traditional payment processors.",
    date: "2026-07-10",
    tags: ["Payments", "Philosophy"],
  },
  {
    slug: "ai-wallet-intelligence",
    title: "How AI Transforms Wallet Intelligence",
    excerpt: "Deep dive into our risk scoring and relationship mapping algorithms.",
    date: "2026-07-15",
    tags: ["AI", "Research"],
  },
];

export const metadata = {
  title: "Blog",
  description: "Insights, updates, and research from the Archive44 team.",
};

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">
          Archive44 <span className="gradient-text">Blog</span>
        </h1>
        <p className="text-muted-foreground">Insights on crypto intelligence, AI, and on-chain data.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="h-full hover:border-gold/30 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex gap-2 mb-2">
                  {post.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
