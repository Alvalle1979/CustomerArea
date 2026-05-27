import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { extractNumericId, fetchCustomer } from "@/lib/shopify-auth";
import { withMockOrdersIfMatchingUser } from "@/lib/mock-orders";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type TimelineEvent = {
  ts: Date | null;
  label: string;
  done: boolean;
};

type FreightEvent = {
  ts: Date;
  text: string;
};

type TrackingNumber = {
  carrier: string;
  code: string;
};

const PLACEHOLDER_TRACKING: TrackingNumber[] = [
  { carrier: "OTHER", code: "2604022978" },
  { carrier: "UPS", code: "TEST-TRACK-1546-FAKE" },
  { carrier: "OTHER", code: "23212323233232" },
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  customer = withMockOrdersIfMatchingUser(customer);

  const orders = customer.orders?.edges?.map((edge) => edge.node) ?? [];
  const order = orders.find((o) => extractNumericId(o.id) === id);
  if (!order) notFound();

  const formatMoney = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount));

  const formatLongDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));

  const formatTimestamp = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);

  const formatShortDate = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);

  const placed = new Date(order.processedAt);
  const productionEvents: TimelineEvent[] = [
    { ts: placed, label: "Order received", done: true },
    {
      ts: new Date(placed.getTime() + DAY_MS * 2),
      label: "In Production",
      done: true,
    },
    {
      ts: new Date(placed.getTime() + DAY_MS * 2.5),
      label: "Sent to the Freight Forwarder",
      done: true,
    },
    {
      ts: new Date(placed.getTime() + DAY_MS * 4),
      label: "Cleared Customs",
      done: true,
    },
    {
      ts: new Date(placed.getTime() + DAY_MS * 6),
      label: "FedEx Local Facility",
      done: true,
    },
    { ts: null, label: "Out for Delivery", done: false },
  ];

  const freightEvents: FreightEvent[] = [
    {
      ts: new Date(placed.getTime() + DAY_MS * 2),
      text: "Your package was picked up and is being prepared for the next stage of its journey.",
    },
    {
      ts: new Date(placed.getTime() + DAY_MS * 3),
      text: "Your package arrived at a FedEx location in Niles, IL.",
    },
    {
      ts: new Date(placed.getTime() + DAY_MS * 3),
      text: "Your package departed a FedEx facility in Niles, IL.",
    },
  ];

  const earlierEvents = freightEvents.slice(0, freightEvents.length - 3);
  const recentEvents = freightEvents.slice(-3);

  return (
    <main className="assembly-main">
      <div className="assembly-page">
        <header className="assembly-top">
          <div className="assembly-top-left">
            <div className="assembly-eyebrow">THE ASSEMBLY LINE</div>
            <h1 className="assembly-h1">Order {order.name}</h1>
            <p className="assembly-sub">
              Placed {formatLongDate(order.processedAt)} · Total{" "}
              {formatMoney(
                order.totalPrice.amount,
                order.totalPrice.currencyCode
              )}
            </p>
          </div>
          <div className="assembly-actions">
            <span className="assembly-badge assembly-badge-green">
              <span className="assembly-badge-dot" /> FULFILLED
            </span>
            <button className="assembly-btn-outline">
              <span aria-hidden>⬇</span> Invoice
            </button>
            <button className="assembly-btn-primary">
              Reorder <span aria-hidden>→</span>
            </button>
          </div>
        </header>

        <div className="assembly-grid-2">
          <section className="assembly-card">
            <div className="assembly-card-head">
              <span aria-hidden className="assembly-card-icon">
                ⚙
              </span>
              <span className="assembly-card-title">PRODUCTION UPDATES</span>
            </div>
            <div className="assembly-card-divider" />
            <ul className="assembly-timeline">
              {productionEvents.map((ev) => (
                <li
                  key={ev.label}
                  className={`assembly-event ${ev.done ? "done" : "pending"}`}
                >
                  <span className="assembly-event-dot" />
                  <div className="assembly-event-body">
                    <div className="assembly-event-time">
                      {ev.ts ? formatTimestamp(ev.ts) : "—"}
                    </div>
                    <div className="assembly-event-title">{ev.label}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="assembly-card">
            <div className="assembly-card-head">
              <span aria-hidden className="assembly-card-icon">
                🚚
              </span>
              <span className="assembly-card-title">FREIGHT TRACKING</span>
            </div>
            <div className="assembly-card-divider" />
            <p className="assembly-freight-text">
              Your package is currently in transit within the US and moving
              through the FedEx network.
            </p>

            {earlierEvents.length > 0 && (
              <details className="assembly-collapse">
                <summary>
                  View {earlierEvents.length} earlier update
                  {earlierEvents.length === 1 ? "" : "s"}
                </summary>
                <ul className="assembly-timeline">
                  {earlierEvents.map((ev, idx) => (
                    <li key={idx} className="assembly-event done">
                      <span className="assembly-event-dot" />
                      <div className="assembly-event-body">
                        <div className="assembly-event-time">
                          {formatShortDate(ev.ts)}
                        </div>
                        <div className="assembly-event-title">{ev.text}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <ul className="assembly-timeline">
              {recentEvents.map((ev, idx) => (
                <li key={idx} className="assembly-event done">
                  <span className="assembly-event-dot" />
                  <div className="assembly-event-body">
                    <div className="assembly-event-time">
                      {formatShortDate(ev.ts)}
                    </div>
                    <div className="assembly-event-title">{ev.text}</div>
                  </div>
                </li>
              ))}
            </ul>

            <p className="assembly-freight-note">
              We&rsquo;ll continue to monitor your order closely and provide
              updates as it gets closer to you.
            </p>
          </section>
        </div>

        <section className="assembly-card">
          <div className="assembly-card-head">
            <span className="assembly-card-title">TRACKING NUMBERS</span>
          </div>
          <div className="assembly-card-divider" />
          <ul className="assembly-tracking">
            {PLACEHOLDER_TRACKING.map((t, idx) => (
              <li key={idx} className="assembly-tracking-row">
                <div>
                  <div className="assembly-tracking-carrier">{t.carrier}</div>
                  <div className="assembly-tracking-code">{t.code}</div>
                </div>
                <button className="assembly-btn-outline assembly-track-btn">
                  Track <span aria-hidden>↗</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="assembly-card">
          <div className="assembly-card-head">
            <span className="assembly-card-title">ORDER ITEMS</span>
          </div>
          <div className="assembly-card-divider" />
          <ul className="assembly-items">
            {order.lineItems.edges.map((item, idx) => (
              <li key={idx} className="assembly-item">
                <div className="assembly-item-thumb">
                  {item.node.image?.url ? (
                    <img
                      src={item.node.image.url}
                      alt={item.node.image.altText ?? item.node.title}
                    />
                  ) : (
                    <span aria-hidden className="assembly-item-thumb-x">✕</span>
                  )}
                </div>
                <div className="assembly-item-info">
                  <div className="assembly-item-title">{item.node.title}</div>
                </div>
                <div className="assembly-item-qty">Qty {item.node.quantity}</div>
              </li>
            ))}
          </ul>
        </section>

        <Link href="/dashboard/orders" className="assembly-back">
          ← Back to Order History
        </Link>
      </div>
    </main>
  );
}
