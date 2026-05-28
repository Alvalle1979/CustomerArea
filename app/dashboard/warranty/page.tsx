import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { fetchCustomer } from "@/lib/shopify-auth";
import { DashboardShell } from "../_components/DashboardShell";

export const dynamic = "force-dynamic";

const COVERAGE = [
  {
    label: "FRAME",
    term: "5 years",
    note: "Structural defects on all aluminum and carbon frames.",
  },
  {
    label: "BATTERY",
    term: "2 years",
    note: "Cells retain ≥70% of original capacity through normal use.",
  },
  {
    label: "MOTOR & DRIVETRAIN",
    term: "2 years",
    note: "Manufacturing defects on hub and mid-drive units.",
  },
  {
    label: "COMPONENTS",
    term: "1 year",
    note: "Cockpit, wheels and electronics excluding wear parts.",
  },
];

export default async function WarrantyPage() {
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

  const orders = customer.orders?.edges?.map((e) => e.node) ?? [];
  const products = orders
    .flatMap((order) =>
      order.lineItems.edges.map((edge) => ({
        orderName: order.name,
        processedAt: order.processedAt,
        title: edge.node.title,
        image: edge.node.image?.url ?? null,
      }))
    )
    .slice(0, 6);

  const formatDateLong = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));

  const coverageUntil = (iso: string) => {
    const d = new Date(iso);
    d.setFullYear(d.getFullYear() + 5);
    return formatDateLong(d.toISOString());
  };

  return (
    <DashboardShell customer={customer} active="warranty">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">ACCOUNT / WARRANTY</div>
        <div className="tb-hero">
          <div>
            <h1 className="tb-h1">Warranty</h1>
            <p className="tb-hero-sub">
              Every Twitter Bike is backed by our 5-year structural warranty.
              Track your policies, file a claim and check coverage details.
            </p>
          </div>

          <div className="tb-stats">
            <div className="tb-stat">
              <div className="tb-stat-label">ACTIVE POLICIES</div>
              <div className="tb-stat-value">{products.length || 2}</div>
              <div className="tb-stat-meta">all in good standing</div>
            </div>
            <div className="tb-stat">
              <div className="tb-stat-label">OPEN CLAIMS</div>
              <div className="tb-stat-value">0</div>
              <div className="tb-stat-meta">No pending requests</div>
            </div>
            <div className="tb-stat">
              <div className="tb-stat-label">FRAME COVERAGE</div>
              <div className="tb-stat-value">5y</div>
              <div className="tb-stat-meta">From purchase date</div>
            </div>
          </div>
        </div>
      </header>

      <div className="tb-card">
        <div className="tb-card-header">
          <span className="tb-card-title">COVERED PRODUCTS</span>
          <Link href="/dashboard/orders" className="tb-link-text">
            All orders →
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="tb-empty">
            No registered products yet. Warranty activates automatically once
            your first order is fulfilled.
          </p>
        ) : (
          <ul className="tb-orders">
            {products.map((product, idx) => (
              <li key={`${product.orderName}-${idx}`}>
                <div className="tb-order-row" style={{ cursor: "default" }}>
                  <div className="tb-order-thumb">
                    {product.image ? (
                      <img src={product.image} alt="" />
                    ) : (
                      <span aria-hidden>◯</span>
                    )}
                  </div>
                  <div className="tb-order-info">
                    <div className="tb-order-id">{product.title}</div>
                    <div className="tb-order-date">
                      Order {product.orderName} ·{" "}
                      {formatDateLong(product.processedAt)}
                    </div>
                  </div>
                  <span className="tb-badge tb-badge-green">
                    <span className="tb-badge-dot" /> ACTIVE
                  </span>
                  <span className="tb-order-total">
                    Until {coverageUntil(product.processedAt)}
                  </span>
                  <span aria-hidden />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tb-grid-2">
        <div className="tb-card">
          <div className="tb-card-header">
            <span className="tb-card-title">COVERAGE BREAKDOWN</span>
          </div>
          <ul className="tb-orders">
            {COVERAGE.map((item) => (
              <li key={item.label}>
                <div className="tb-order-row" style={{ cursor: "default" }}>
                  <div className="tb-need-icon" aria-hidden>
                    ◈
                  </div>
                  <div className="tb-order-info">
                    <div className="tb-order-id">{item.label}</div>
                    <div className="tb-order-date">{item.note}</div>
                  </div>
                  <span aria-hidden />
                  <span className="tb-order-total">{item.term}</span>
                  <span aria-hidden />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="tb-right-col">
          <div className="tb-card">
            <div className="tb-card-header">
              <span className="tb-card-title">FILE A CLAIM</span>
            </div>
            <p className="tb-empty" style={{ paddingTop: 0 }}>
              Found a structural issue or a defect? Open a claim and our
              after-sales team will get back within 1 business day.
            </p>
            <div className="tb-addr-actions" style={{ borderTop: 0, paddingTop: 0 }}>
              <a
                href="mailto:warranty@twitterbike.com?subject=Warranty%20claim"
                className="tb-btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Open a claim
              </a>
            </div>
          </div>

          <div className="tb-card">
            <div className="tb-card-header">
              <span className="tb-card-title">WARRANTY SUPPORT</span>
            </div>
            <div className="tb-need-item" style={{ marginBottom: 10 }}>
              <span className="tb-need-icon" aria-hidden>
                ◈
              </span>
              <div>
                <div className="tb-need-label">PHONE</div>
                <div className="tb-need-value">+1 (262) 344-0570</div>
              </div>
            </div>
            <div className="tb-need-item">
              <span className="tb-need-icon" aria-hidden>
                ✉
              </span>
              <div>
                <div className="tb-need-label">EMAIL</div>
                <div className="tb-need-value">warranty@twitterbike.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tb-warranty-note">
        <span className="tb-warranty-icon" aria-hidden>
          ◈
        </span>
        Warranty covers manufacturing defects only. Wear parts (tires, brake
        pads, chain, cables) and damage from crashes, modifications or
        improper maintenance are not included.
      </div>
    </DashboardShell>
  );
}
