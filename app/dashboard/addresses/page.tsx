import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { fetchCustomer, type MailingAddress } from "@/lib/shopify-auth";
import { DashboardShell } from "../_components/DashboardShell";
import { deleteAddressAction } from "./actions";

export const dynamic = "force-dynamic";

function extractIdSuffix(gid: string): string {
  const match = gid.match(/\/([^/?]+)(?:\?|$)/);
  return match ? match[1] : gid;
}

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  const defaultId = customer.defaultAddress?.id ?? null;
  const addresses: MailingAddress[] =
    customer.addresses?.edges?.map((e) => e.node) ?? [];

  return (
    <DashboardShell customer={customer} active="addresses">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">ACCOUNT / ADDRESSES</div>
        <div className="tb-orders-hero">
          <h1 className="tb-h1">Addresses</h1>
          <Link href="/dashboard/addresses/new" className="tb-pill-btn">
            + Add new address
          </Link>
        </div>
      </header>

      {error && (
        <div className="tb-card" style={{ borderColor: "#dc2626" }}>
          <div className="tb-card-header">
            <span className="tb-card-title" style={{ color: "#dc2626" }}>
              {error}
            </span>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="tb-card">
          <div className="tb-card-header">
            <span className="tb-card-title">NO ADDRESSES SAVED</span>
          </div>
          <p className="tb-empty">
            You don&rsquo;t have any saved addresses yet. Add one to speed up
            future orders.
          </p>
        </div>
      ) : (
        <div className="tb-grid-2">
          {addresses.map((address) => {
            const isDefault = address.id === defaultId;
            const idSuffix = extractIdSuffix(address.id);
            const name =
              [address.firstName, address.lastName].filter(Boolean).join(" ") ||
              customer.displayName ||
              "Address";
            return (
              <div key={address.id} className="tb-card">
                <div className="tb-card-header">
                  <span className="tb-card-title">
                    {isDefault ? "DEFAULT ADDRESS" : "ADDRESS"}
                  </span>
                  {isDefault && (
                    <span className="tb-badge tb-badge-green">
                      <span className="tb-badge-dot" /> DEFAULT
                    </span>
                  )}
                </div>
                <div className="tb-address">
                  <div className="tb-addr-name">{name}</div>
                  {address.formatted?.map((line, idx) => (
                    <div key={idx} className="tb-addr-line">
                      {line}
                    </div>
                  ))}
                  {address.phoneNumber && (
                    <div className="tb-addr-line">{address.phoneNumber}</div>
                  )}
                </div>
                <div className="tb-addr-actions">
                  <Link
                    href={`/dashboard/addresses/${encodeURIComponent(idSuffix)}/edit`}
                    className="tb-btn-ghost"
                  >
                    ✎ Edit
                  </Link>
                  {!isDefault && (
                    <form action={deleteAddressAction}>
                      <input
                        type="hidden"
                        name="addressId"
                        value={address.id}
                      />
                      <button
                        type="submit"
                        className="tb-btn-ghost"
                        style={{ color: "#dc2626" }}
                      >
                        🗑 Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
