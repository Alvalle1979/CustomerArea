import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { extractNumericId, fetchCustomer } from "@/lib/shopify-auth";
import { DashboardShell } from "./_components/DashboardShell";

export const dynamic = "force-dynamic";

const PROGRESS_STEPS = [
  "Order received",
  "In production",
  "Freight forwarder",
  "Customs",
  "Local facility",
  "Delivered",
];

export default async function DashboardPage() {
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

  const fullName =
    customer.displayName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Member";

  const email = customer.emailAddress?.emailAddress ?? "";
  const orders = customer.orders?.edges?.map((e) => e.node) ?? [];
  const activeOrder = orders[0];
  const recentOrders = orders.slice(0, 3);

  const oldestOrderDate = orders.length
    ? new Date(orders[orders.length - 1].processedAt)
    : new Date();
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(oldestOrderDate);

  const formatMoney = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount));

  const formatDateLong = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));

  const currentStep = 4;

  return (
    <DashboardShell customer={customer} active="overview">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">ACCOUNT / OVERVIEW</div>
        <div className="tb-hero">
          <div>
            <h1 className="tb-h1">
              Welcome back,
              <br />
              {fullName}.
            </h1>
            <p className="tb-hero-sub">
              Member since {memberSince}
              {email ? ` · ${email}` : ""}
            </p>
          </div>

          <div className="tb-stats">
            <div className="tb-stat">
              <div className="tb-stat-label">ACTIVE ORDERS</div>
              <div className="tb-stat-value">{activeOrder ? 1 : 0}</div>
              <div className="tb-stat-meta">
                {activeOrder ? "In transit" : "No active orders"}
              </div>
            </div>
            <div className="tb-stat">
              <div className="tb-stat-label">LIFETIME ORDERS</div>
              <div className="tb-stat-value">{orders.length}</div>
            </div>
            <div className="tb-stat">
              <div className="tb-stat-label">WARRANTY COVERAGE</div>
              <div className="tb-stat-value">2</div>
              <div className="tb-stat-meta">active policies</div>
            </div>
          </div>
        </div>
      </header>

      {activeOrder && (
        <div className="tb-card tb-active-card">
          <div className="tb-card-header">
            <span className="tb-card-title">
              <span className="tb-red-dot" aria-hidden /> ACTIVE ORDER
            </span>
            <Link
              href={`/dashboard/orders/${extractNumericId(activeOrder.id)}`}
              className="tb-pill-btn"
            >
              View details →
            </Link>
          </div>
          <div className="tb-active-body">
            <div className="tb-active-thumb">
              {activeOrder.lineItems.edges[0]?.node.image?.url ? (
                <img
                  src={activeOrder.lineItems.edges[0].node.image.url}
                  alt={
                    activeOrder.lineItems.edges[0].node.image.altText ??
                    activeOrder.lineItems.edges[0].node.title
                  }
                />
              ) : (
                <span className="tb-thumb-fallback" aria-hidden>
                  ◯
                </span>
              )}
            </div>

            <div className="tb-active-info">
              <div className="tb-active-meta">ORDER {activeOrder.name}</div>
              <div className="tb-active-title">
                {activeOrder.lineItems.edges[0]?.node.title ?? "Item"}
              </div>
              <div className="tb-active-variant">
                {activeOrder.lineItems.edges.length}{" "}
                {activeOrder.lineItems.edges.length === 1 ? "item" : "items"}
              </div>
              <div className="tb-active-status">
                <span className="tb-badge tb-badge-amber">
                  <span className="tb-badge-dot" /> IN TRANSIT
                </span>
                <span className="tb-sep">·</span>
                <span className="tb-active-placed">
                  Placed {formatDateLong(activeOrder.processedAt)}
                </span>
              </div>
            </div>

            <div className="tb-steps">
              {PROGRESS_STEPS.map((label, idx) => {
                const done = idx < currentStep;
                const current = idx === currentStep;
                return (
                  <div
                    key={label}
                    className={`tb-step ${done ? "done" : ""} ${
                      current ? "current" : ""
                    }`}
                  >
                    <span className="tb-step-dot" />
                    <span className="tb-step-label">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="tb-grid-2">
        <div className="tb-card">
          <div className="tb-card-header">
            <span className="tb-card-title">RECENT ORDERS</span>
            <Link href="/dashboard/orders" className="tb-link-text">
              All orders →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="tb-empty">No orders yet.</p>
          ) : (
            <ul className="tb-orders">
              {recentOrders.map((order) => {
                const img = order.lineItems.edges[0]?.node.image?.url;
                return (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/orders/${extractNumericId(order.id)}`}
                      className="tb-order-row"
                    >
                      <div className="tb-order-thumb">
                        {img ? (
                          <img src={img} alt="" />
                        ) : (
                          <span aria-hidden>◯</span>
                        )}
                      </div>
                      <div className="tb-order-info">
                        <div className="tb-order-id">{order.name}</div>
                        <div className="tb-order-date">
                          {formatDateLong(order.processedAt)}
                        </div>
                      </div>
                      <span className="tb-badge tb-badge-green">
                        <span className="tb-badge-dot" /> FULFILLED
                      </span>
                      <span className="tb-order-total">
                        {formatMoney(
                          order.totalPrice.amount,
                          order.totalPrice.currencyCode
                        )}
                      </span>
                      <span className="tb-chevron" aria-hidden>
                        ›
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="tb-right-col">
          <div className="tb-card">
            <div className="tb-card-header">
              <span className="tb-card-title">DEFAULT ADDRESS</span>
              <Link href="/dashboard/addresses" className="tb-link-text">
                Manage
              </Link>
            </div>
            {customer.defaultAddress ? (
              <>
                <div className="tb-address">
                  <div className="tb-addr-name">
                    {[
                      customer.defaultAddress.firstName,
                      customer.defaultAddress.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || fullName}
                  </div>
                  {customer.defaultAddress.formatted?.map((line, idx) => (
                    <div key={idx} className="tb-addr-line">
                      {line}
                    </div>
                  ))}
                </div>
                <div className="tb-addr-actions">
                  <Link
                    href={`/dashboard/addresses/${encodeURIComponent(
                      (customer.defaultAddress.id.match(/\/([^/?]+)(?:\?|$)/) ?? [
                        "",
                        customer.defaultAddress.id,
                      ])[1]
                    )}/edit`}
                    className="tb-btn-ghost"
                  >
                    ✎ Edit
                  </Link>
                  <Link href="/dashboard/addresses" className="tb-btn-ghost">
                    ↻ Change
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="tb-empty">No default address on file yet.</p>
                <div className="tb-addr-actions">
                  <Link href="/dashboard/addresses/new" className="tb-btn-ghost">
                    + Add address
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="tb-card">
            <div className="tb-card-header">
              <span className="tb-card-title">WARRANTY</span>
              <Link href="/dashboard/warranty" className="tb-link-text">
                Open →
              </Link>
            </div>
            <div className="tb-warranty-grid">
              <div className="tb-warranty-stat">
                <div className="tb-warranty-num">2</div>
                <div className="tb-warranty-label">ACTIVE POLICIES</div>
              </div>
              <div className="tb-warranty-stat">
                <div className="tb-warranty-num">0</div>
                <div className="tb-warranty-label">OPEN CLAIMS</div>
              </div>
            </div>
            <div className="tb-warranty-note">
              <span className="tb-warranty-icon" aria-hidden>
                ◈
              </span>
              All products covered by Twitter Bike 5-year structural warranty.
            </div>
          </div>
        </div>
      </div>

      <div className="tb-card tb-need-card">
        <div className="tb-card-header">
          <span className="tb-card-title">NEED A HAND?</span>
          <Link href="/dashboard/support" className="tb-link-text">
            Contact options →
          </Link>
        </div>
        <div className="tb-need-grid">
          <div className="tb-need-item">
            <span className="tb-need-icon" aria-hidden>
              ◊
            </span>
            <div>
              <div className="tb-need-label">AFTER-SALES</div>
              <div className="tb-need-value">+1 (313) 746-3367</div>
            </div>
          </div>
          <div className="tb-need-item">
            <span className="tb-need-icon" aria-hidden>
              ◈
            </span>
            <div>
              <div className="tb-need-label">WARRANTY</div>
              <div className="tb-need-value">+1 (262) 344-0570</div>
            </div>
          </div>
          <div className="tb-need-item">
            <span className="tb-need-icon" aria-hidden>
              ◴
            </span>
            <div>
              <div className="tb-need-label">PRODUCTION WINDOW</div>
              <div className="tb-need-value">10–25 business days</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
