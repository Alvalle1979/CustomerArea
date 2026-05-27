import crypto from "crypto";

export function getShopifyConfig() {
  const shopId = process.env.SHOPIFY_SHOP_ID;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!shopId || !clientId) {
    throw new Error(
      "SHOPIFY_SHOP_ID e SHOPIFY_CLIENT_ID precisam estar definidos no .env.local"
    );
  }

  return {
    shopId,
    clientId,
    appUrl,
    redirectUri: `${appUrl}/api/auth/callback`,
    authorizeUrl: `https://shopify.com/authentication/${shopId}/oauth/authorize`,
    tokenUrl: `https://shopify.com/authentication/${shopId}/oauth/token`,
    logoutUrl: `https://shopify.com/authentication/${shopId}/logout`,
    customerApiUrl: `https://shopify.com/${shopId}/account/customer/api/2024-10/graphql`,
  };
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  return base64UrlEncode(crypto.createHash("sha256").update(verifier).digest());
}

export function generateState(): string {
  return base64UrlEncode(crypto.randomBytes(16));
}

export function generateNonce(): string {
  return base64UrlEncode(crypto.randomBytes(16));
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const { clientId, redirectUri, tokenUrl } = getShopifyConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: process.env.APP_URL ?? "http://localhost:3000",
    },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha ao trocar code por token: ${res.status} ${errorText}`);
  }

  return res.json();
}

export function extractNumericId(gid: string): string {
  const match = gid.match(/\/(\d+)(?:\?|$)/);
  return match ? match[1] : gid;
}

export interface OrderLineItem {
  title: string;
  quantity: number;
  image: { url: string; altText: string | null } | null;
}

export interface Order {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  note: string | null;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: { edges: { node: OrderLineItem }[] };
}

export interface MailingAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zoneCode: string | null;
  zip: string | null;
  territoryCode: string | null;
  phoneNumber: string | null;
  formatted: string[];
}

export interface CustomerInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  emailAddress: { emailAddress: string } | null;
  orders: { edges: { node: Order }[] };
  defaultAddress: MailingAddress | null;
  addresses: { edges: { node: MailingAddress }[] };
}

export async function fetchCustomer(accessToken: string): Promise<CustomerInfo> {
  const { customerApiUrl } = getShopifyConfig();

  const query = `
    query getCustomer {
      customer {
        id
        firstName
        lastName
        displayName
        emailAddress {
          emailAddress
        }
        defaultAddress {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          zoneCode
          zip
          territoryCode
          phoneNumber
          formatted
        }
        addresses(first: 20) {
          edges {
            node {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              zoneCode
              zip
              territoryCode
              phoneNumber
              formatted
            }
          }
        }
        orders(first: 20, reverse: true) {
          edges {
            node {
              id
              name
              number
              processedAt
              note
              totalPrice {
                amount
                currencyCode
              }
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(customerApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha ao buscar customer: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  if (data.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.customer;
}

export interface AddressInput {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  zip?: string;
  territoryCode?: string;
  phoneNumber?: string;
}

export interface UserError {
  field: string[] | null;
  message: string;
  code?: string | null;
}

async function runCustomerMutation(
  accessToken: string,
  query: string,
  variables: Record<string, unknown>
): Promise<{ data: any; userErrors: UserError[] }> {
  const { customerApiUrl } = getShopifyConfig();

  const res = await fetch(customerApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Customer API HTTP ${res.status}: ${text}`);
  }

  const payload = await res.json();

  if (payload.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(payload.errors)}`);
  }

  const root = payload.data ? Object.values(payload.data)[0] : null;
  const userErrors = (root as { userErrors?: UserError[] })?.userErrors ?? [];

  return { data: root, userErrors };
}

export async function createAddress(
  accessToken: string,
  address: AddressInput,
  setAsDefault = false
): Promise<{ userErrors: UserError[] }> {
  const mutation = `
    mutation customerAddressCreate(
      $address: CustomerAddressInput!
      $defaultAddress: Boolean
    ) {
      customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
        customerAddress {
          id
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const { userErrors } = await runCustomerMutation(accessToken, mutation, {
    address,
    defaultAddress: setAsDefault,
  });

  return { userErrors };
}

export async function updateAddress(
  accessToken: string,
  addressId: string,
  address: AddressInput,
  setAsDefault = false
): Promise<{ userErrors: UserError[] }> {
  const mutation = `
    mutation customerAddressUpdate(
      $addressId: ID!
      $address: CustomerAddressInput!
      $defaultAddress: Boolean
    ) {
      customerAddressUpdate(
        addressId: $addressId
        address: $address
        defaultAddress: $defaultAddress
      ) {
        customerAddress {
          id
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const { userErrors } = await runCustomerMutation(accessToken, mutation, {
    addressId,
    address,
    defaultAddress: setAsDefault,
  });

  return { userErrors };
}

export async function deleteAddress(
  accessToken: string,
  addressId: string
): Promise<{ userErrors: UserError[] }> {
  const mutation = `
    mutation customerAddressDelete($addressId: ID!) {
      customerAddressDelete(addressId: $addressId) {
        deletedAddressId
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const { userErrors } = await runCustomerMutation(accessToken, mutation, {
    addressId,
  });

  return { userErrors };
}
