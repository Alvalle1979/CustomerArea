"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  type AddressInput,
} from "@/lib/shopify-auth";

async function requireAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/");
  return session.accessToken;
}

function parseAddressFromFormData(formData: FormData): AddressInput {
  const pick = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  return {
    firstName: pick("firstName"),
    lastName: pick("lastName"),
    company: pick("company"),
    address1: pick("address1"),
    address2: pick("address2"),
    city: pick("city"),
    zoneCode: pick("zoneCode"),
    zip: pick("zip"),
    territoryCode: pick("territoryCode"),
    phoneNumber: pick("phoneNumber"),
  };
}

function buildErrorRedirect(basePath: string, message: string): string {
  const params = new URLSearchParams({ error: message });
  return `${basePath}?${params.toString()}`;
}

export async function createAddressAction(formData: FormData) {
  const accessToken = await requireAccessToken();
  const address = parseAddressFromFormData(formData);
  const setAsDefault = formData.get("setAsDefault") === "on";

  try {
    const { userErrors } = await createAddress(accessToken, address, setAsDefault);
    if (userErrors.length > 0) {
      redirect(
        buildErrorRedirect(
          "/dashboard/addresses/new",
          userErrors.map((e) => e.message).join("; ")
        )
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT")) throw err;
    console.error(err);
    redirect(
      buildErrorRedirect(
        "/dashboard/addresses/new",
        "Could not save address. Please try again."
      )
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/addresses");
  redirect("/dashboard/addresses");
}

export async function updateAddressAction(addressId: string, formData: FormData) {
  const accessToken = await requireAccessToken();
  const address = parseAddressFromFormData(formData);
  const setAsDefault = formData.get("setAsDefault") === "on";
  const editPath = `/dashboard/addresses/${encodeURIComponent(addressId)}/edit`;

  try {
    const { userErrors } = await updateAddress(
      accessToken,
      addressId,
      address,
      setAsDefault
    );
    if (userErrors.length > 0) {
      redirect(
        buildErrorRedirect(
          editPath,
          userErrors.map((e) => e.message).join("; ")
        )
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT")) throw err;
    console.error(err);
    redirect(
      buildErrorRedirect(editPath, "Could not update address. Please try again.")
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/addresses");
  redirect("/dashboard/addresses");
}

export async function deleteAddressAction(formData: FormData) {
  const accessToken = await requireAccessToken();
  const addressId = formData.get("addressId");
  if (typeof addressId !== "string" || !addressId) {
    redirect(
      buildErrorRedirect("/dashboard/addresses", "Missing address reference.")
    );
  }

  try {
    const { userErrors } = await deleteAddress(accessToken, addressId as string);
    if (userErrors.length > 0) {
      redirect(
        buildErrorRedirect(
          "/dashboard/addresses",
          userErrors.map((e) => e.message).join("; ")
        )
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT")) throw err;
    console.error(err);
    redirect(
      buildErrorRedirect(
        "/dashboard/addresses",
        "Could not delete address. Please try again."
      )
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/addresses");
  redirect("/dashboard/addresses");
}
