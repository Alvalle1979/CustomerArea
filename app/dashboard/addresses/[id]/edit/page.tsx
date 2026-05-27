import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { fetchCustomer } from "@/lib/shopify-auth";
import { DashboardShell } from "../../../_components/DashboardShell";
import { AddressForm } from "../../_components/AddressForm";
import { updateAddressAction } from "../../actions";

export const dynamic = "force-dynamic";

function extractIdSuffix(gid: string): string {
  const match = gid.match(/\/([^/?]+)(?:\?|$)/);
  return match ? match[1] : gid;
}

export default async function EditAddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
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

  const addresses = customer.addresses?.edges?.map((e) => e.node) ?? [];
  const address = addresses.find((a) => extractIdSuffix(a.id) === id);
  if (!address) notFound();

  const isDefault = customer.defaultAddress?.id === address.id;
  const boundAction = updateAddressAction.bind(null, address.id);

  return (
    <DashboardShell customer={customer} active="addresses">
      <header className="tb-content-header">
        <div className="tb-breadcrumb">
          ACCOUNT / <Link href="/dashboard/addresses">ADDRESSES</Link> / EDIT
        </div>
        <h1 className="tb-h1">Edit address</h1>
      </header>

      <div className="tb-card">
        <AddressForm
          action={boundAction}
          address={address}
          isDefault={isDefault}
          submitLabel="Save changes"
          cancelHref="/dashboard/addresses"
          error={error}
        />
      </div>
    </DashboardShell>
  );
}
