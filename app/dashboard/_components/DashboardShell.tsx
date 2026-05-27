import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { CustomerInfo } from "@/lib/shopify-auth";

type NavKey = "overview" | "orders" | "addresses" | "warranty" | "support";

const NAV_ITEMS: Array<{ key: NavKey; label: string; icon: string; href: string }> = [
  { key: "overview", label: "Overview", icon: "▦", href: "/dashboard" },
  { key: "orders", label: "Order History", icon: "▢", href: "/dashboard/orders" },
  { key: "addresses", label: "Addresses", icon: "◉", href: "/dashboard/addresses" },
  { key: "warranty", label: "Warranty", icon: "◈", href: "#" },
  { key: "support", label: "Support", icon: "◊", href: "#" },
];

export function DashboardShell({
  customer,
  active,
  children,
}: {
  customer: CustomerInfo;
  active: NavKey;
  children: ReactNode;
}) {
  const fullName =
    customer.displayName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Member";

  const initials = (fullName.match(/\b\w/g) ?? ["?"])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const email = customer.emailAddress?.emailAddress ?? "";

  return (
    <main className="tb-main">
      <nav className="tb-topnav">
        <div className="tb-topnav-inner">
          <div className="tb-topnav-left">
            <Link href="/dashboard" className="tb-logo">
              <Image
                src="/logo-twitter.png"
                alt="Twitter Bike"
                width={32}
                height={32}
                className="tb-logo-img"
              />
              <span className="tb-logo-text">
                TWITTER<span className="tb-logo-accent">BIKE</span>
              </span>
            </Link>
          </div>
          <div className="tb-topnav-right">
            <button className="tb-bell" aria-label="Notifications">
              <span className="tb-bell-dot" aria-hidden />
              <span aria-hidden>◔</span>
            </button>
            <div className="tb-avatar tb-avatar-sm">{initials}</div>
          </div>
        </div>
      </nav>

      <div className="tb-layout">
        <aside className="tb-sidebar">
          <div className="tb-sidebar-user">
            <div className="tb-avatar tb-avatar-lg">{initials}</div>
            <div>
              <div className="tb-side-label">MEMBER</div>
              <div className="tb-side-name">{fullName}</div>
              {email && <div className="tb-side-email">{email}</div>}
            </div>
          </div>

          <div className="tb-divider-h" />

          <ul className="tb-sidenav">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`tb-sidenav-item ${
                    active === item.key ? "active" : ""
                  }`}
                >
                  <span className="tb-sidenav-icon" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="tb-divider-h" />

          <a href="/api/auth/logout" className="tb-sidenav-item tb-logout">
            <span className="tb-sidenav-icon" aria-hidden>
              ↩
            </span>
            Log out
          </a>

          <div className="tb-side-support">
            <div className="tb-side-label">SUPPORT</div>
            <div className="tb-side-phone">+1 (313) 746-3367</div>
          </div>
        </aside>

        <section className="tb-content">
          {children}

          <footer className="tb-footer">
            <div className="tb-footer-logo">
              <Image
                src="/logo-twitter.png"
                alt="Twitter Bike"
                width={24}
                height={24}
              />
              <span>
                TWITTER<span className="tb-logo-accent">BIKE</span>
              </span>
            </div>
            <div className="tb-footer-copy">
              © 2026 TWITTER BIKE USA · ALL RIGHTS RESERVED
            </div>
          </footer>
        </section>
      </div>

      <a
        href="https://wa.me/13137463367"
        target="_blank"
        rel="noopener noreferrer"
        className="tb-help-fab"
      >
        <span aria-hidden>💬</span>
        Need help?
      </a>
    </main>
  );
}
