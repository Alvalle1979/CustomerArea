import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { fetchCustomer } from "@/lib/shopify-auth";
import { DashboardShell } from "../../_components/DashboardShell";
import { AddressForm } from "../_components/AddressForm";
import { createAddressAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewAddressPage({
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

  const hasNoAddresses = (customer.addresses?.edges?.length ?? 0) === 0;

  return (
    <DashboardShell customer={customer} active="addresses">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">
          ACCOUNT / <Link href="/dashboard/addresses">ADDRESSES</Link> / NEW
        </div>
        <h1 className="tb-h1">Add a new address</h1>
      </header>

      <div className="tb-card">
        <AddressForm
          action={createAddressAction}
          isDefault={hasNoAddresses}
          submitLabel="Save address"
          cancelHref="/dashboard/addresses"
          error={error}
        />
      </div>
    </DashboardShell>
  );
}
