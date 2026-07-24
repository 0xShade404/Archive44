export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Last updated: July 2026</p>
        <p>
          By accessing or using Archive44, you agree to be bound by these Terms of Service.
        </p>
        <h2 className="text-xl font-semibold text-white">Use of Service</h2>
        <p>
          Archive44 provides AI-powered crypto intelligence tools. You agree to use the platform
          lawfully and not to abuse rate limits, scrape data, or attempt unauthorized access.
        </p>
        <h2 className="text-xl font-semibold text-white">Subscriptions & Payments</h2>
        <p>
          Paid plans are processed via on-chain crypto payments (ETH/USDT). Subscriptions renew
          automatically unless canceled. Refunds are handled on a case-by-case basis.
        </p>
        <h2 className="text-xl font-semibold text-white">Disclaimer</h2>
        <p>
          Archive44 provides information for research purposes. Nothing on the platform constitutes
          financial advice. Always do your own research.
        </p>
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p>For legal inquiries: legal@archive44.com</p>
      </div>
    </div>
  );
}
