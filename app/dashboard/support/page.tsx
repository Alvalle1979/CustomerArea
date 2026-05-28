import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { fetchCustomer } from "@/lib/shopify-auth";
import { DashboardShell } from "../_components/DashboardShell";

export const dynamic = "force-dynamic";

const TOPICS = [
  {
    label: "ORDER & SHIPPING",
    description: "Tracking, delivery windows, customs and freight updates.",
    href: "/dashboard/orders",
  },
  {
    label: "WARRANTY & CLAIMS",
    description: "Frame, battery and motor coverage. File or check a claim.",
    href: "/dashboard/warranty",
  },
  {
    label: "ASSEMBLY & MAINTENANCE",
    description: "Unboxing, torque specs and recommended service intervals.",
    href: "mailto:support@twitterbike.com?subject=Assembly%20%26%20maintenance",
  },
  {
    label: "ACCOUNT & ADDRESSES",
    description: "Update your profile, billing and saved shipping addresses.",
    href: "/dashboard/addresses",
  },
];

const FAQ = [
  {
    q: "How long does production take?",
    a: "Custom builds typically ship within 10–25 business days after the order is confirmed. You'll receive a tracking link as soon as it leaves the facility.",
  },
  {
    q: "Can I change my shipping address after ordering?",
    a: "Yes, until the order moves to the Freight Forwarder stage. Reach out via the contact options below and we'll update it for you.",
  },
  {
    q: "Do you handle customs and import duties?",
    a: "Twitter Bike covers freight and standard customs handling. Local taxes and import duties may apply depending on your destination.",
  },
  {
    q: "How do I register a warranty claim?",
    a: "Open the Warranty section and click \"Open a claim\". Include photos of the issue and your order number — we reply within 1 business day.",
  },
];

export default async function SupportPage() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/");

  let customer;
  try {
    customer = await fetchCustomer(session.accessToken);
  } catch (err) {
    console.error(err);
    redirect("/?error=fetch_failed");
  }

  return (
    <DashboardShell customer={customer} active="support">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">ACCOUNT / SUPPORT</div>
        <div className="tb-orders-hero">
          <div>
            <h1 className="tb-h1">Support</h1>
            <p className="tb-hero-sub">
              We&rsquo;re here to help. Pick the channel that works best for
              you — most requests are answered within a few hours during
              business days.
            </p>
          </div>
          <a
            href="mailto:support@twitterbike.com"
            className="tb-pill-btn"
          >
            ✉ Email us
          </a>
        </div>
      </header>

      <div className="tb-card tb-need-card">
        <div className="tb-card-header">
          <span className="tb-card-title">CONTACT CHANNELS</span>
          <span className="tb-link-text">Mon–Fri · 9 AM – 6 PM EST</span>
        </div>
        <div className="tb-need-grid">
          <a
            href="tel:+13137463367"
            className="tb-need-item"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="tb-need-icon" aria-hidden>
              ◊
            </span>
            <div>
              <div className="tb-need-label">PHONE — AFTER-SALES</div>
              <div className="tb-need-value">+1 (313) 746-3367</div>
            </div>
          </a>
          <a
            href="https://wa.me/13137463367"
            target="_blank"
            rel="noopener noreferrer"
            className="tb-need-item"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="tb-need-icon" aria-hidden>
              💬
            </span>
            <div>
              <div className="tb-need-label">WHATSAPP</div>
              <div className="tb-need-value">+1 (313) 746-3367</div>
            </div>
          </a>
          <a
            href="mailto:support@twitterbike.com"
            className="tb-need-item"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="tb-need-icon" aria-hidden>
              ✉
            </span>
            <div>
              <div className="tb-need-label">EMAIL</div>
              <div className="tb-need-value">support@twitterbike.com</div>
            </div>
          </a>
        </div>
      </div>

      <div className="tb-grid-2">
        <div className="tb-card">
          <div className="tb-card-header">
            <span className="tb-card-title">BROWSE BY TOPIC</span>
          </div>
          <ul className="tb-orders">
            {TOPICS.map((topic) => {
              const isExternal = topic.href.startsWith("mailto:");
              const content = (
                <div className="tb-order-row">
                  <div className="tb-need-icon" aria-hidden>
                    ◊
                  </div>
                  <div className="tb-order-info">
                    <div className="tb-order-id">{topic.label}</div>
                    <div className="tb-order-date">{topic.description}</div>
                  </div>
                  <span aria-hidden />
                  <span aria-hidden />
                  <span className="tb-chevron" aria-hidden>
                    ›
                  </span>
                </div>
              );
              return (
                <li key={topic.label}>
                  {isExternal ? (
                    <a
                      href={topic.href}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link
                      href={topic.href}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="tb-card">
          <div className="tb-card-header">
            <span className="tb-card-title">FREQUENTLY ASKED</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FAQ.map((item, idx) => (
              <details
                key={idx}
                className="assembly-collapse"
                style={{ margin: 0, borderTop: 0, borderBottom: "1px dashed #1a1a1a" }}
              >
                <summary style={{ color: "#ffffff", fontWeight: 600 }}>
                  {item.q}
                </summary>
                <p
                  style={{
                    marginTop: 10,
                    color: "#cbd5e1",
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div className="tb-card">
        <div className="tb-card-header">
          <span className="tb-card-title">STILL NEED HELP?</span>
        </div>
        <p className="tb-empty" style={{ paddingTop: 0 }}>
          Send us a detailed message with your order number and we&rsquo;ll
          route it to the right specialist.
        </p>
        <div className="tb-addr-actions" style={{ borderTop: 0, paddingTop: 0 }}>
          <a
            href="mailto:support@twitterbike.com?subject=Support%20request"
            className="tb-btn-primary"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Open a support request
          </a>
          <a
            href="https://wa.me/13137463367"
            target="_blank"
            rel="noopener noreferrer"
            className="tb-btn-ghost"
          >
            💬 Chat on WhatsApp
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
