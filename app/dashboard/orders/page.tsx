import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { extractNumericId, fetchCustomer } from "@/lib/shopify-auth";
import { withMockOrdersIfMatchingUser } from "@/lib/mock-orders";
import { DashboardShell } from "../_components/DashboardShell";

export const dynamic = "force-dynamic";

type StatusFilter = "all" | "production" | "transit" | "fulfilled";

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "production", label: "In production" },
  { key: "transit", label: "In transit" },
  { key: "fulfilled", label: "Fulfilled" },
];

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter: StatusFilter =
    status === "production" || status === "transit" || status === "fulfilled"
      ? status
      : "all";

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

  const allOrders = customer.orders?.edges?.map((e) => e.node) ?? [];

  const orders =
    activeFilter === "production" || activeFilter === "transit"
      ? []
      : allOrders;

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

  return (
    <DashboardShell customer={customer} active="orders">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">ACCOUNT / ORDERS</div>
        <div className="tb-orders-hero">
          <h1 className="tb-h1">Order History</h1>

          <div className="tb-tabs">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={
                  f.key === "all"
                    ? "/dashboard/orders"
                    : `/dashboard/orders?status=${f.key}`
                }
                className={`tb-tab ${activeFilter === f.key ? "active" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="tb-table-card">
        <div className="tb-table-head">
          <div>ORDER</div>
          <div>ITEMS</div>
          <div>DATE</div>
          <div>STATUS</div>
          <div className="tb-table-right">TOTAL</div>
          <div />
        </div>

        {orders.length === 0 ? (
          <div className="tb-table-empty">
            No orders match this filter.
          </div>
        ) : (
          <ul className="tb-table-body">
            {orders.map((order) => {
              const items = order.lineItems.edges;
              const firstItem = items[0]?.node;
              const extraCount = Math.max(items.length - 1, 0);
              return (
                <li key={order.id} className="tb-table-row">
                  <div className="tb-row-order">
                    <div className="tb-row-id">{order.name}</div>
                    <div className="tb-row-sub">RECEIPT AVAILABLE</div>
                  </div>

                  <div className="tb-row-items">
                    <div className="tb-row-thumbs">
                      {items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="tb-row-thumb">
                          {item.node.image?.url ? (
                            <img
                              src={item.node.image.url}
                              alt=""
                            />
                          ) : (
                            <span aria-hidden className="tb-row-thumb-x">✕</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {firstItem && (
                      <div className="tb-row-title-wrap">
                        <div className="tb-row-title">{firstItem.title}</div>
                        {extraCount > 0 && (
                          <div className="tb-row-more">+ {extraCount} MORE</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="tb-row-date">
                    {formatDateLong(order.processedAt)}
                  </div>

                  <div>
                    <span className="tb-badge tb-badge-green">
                      <span className="tb-badge-dot" /> FULFILLED
                    </span>
                  </div>

                  <div className="tb-row-total">
                    {formatMoney(
                      order.totalPrice.amount,
                      order.totalPrice.currencyCode
                    )}
                  </div>

                  <div className="tb-row-action">
                    <Link
                      href={`/dashboard/orders/${extractNumericId(order.id)}`}
                      className="tb-btn-ghost tb-btn-view"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
