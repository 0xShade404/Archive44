export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Last updated: July 2026</p>
        <p>
          Archive44 (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
        </p>
        <h2 className="text-xl font-semibold text-white">Information We Collect</h2>
        <p>
          We collect information you provide directly (email, name, wallet addresses), usage data,
          and information from connected wallets for subscription and authentication purposes.
        </p>
        <h2 className="text-xl font-semibold text-white">How We Use Your Information</h2>
        <p>
          To provide and improve our services, process crypto payments, send service-related communications,
          and ensure platform security.
        </p>
        <h2 className="text-xl font-semibold text-white">Data Security</h2>
        <p>
          We implement industry-standard security measures. Wallet private keys are never stored or accessible by us.
        </p>
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p>For privacy inquiries, contact us at privacy@archive44.com</p>
      </div>
    </div>
  );
}
