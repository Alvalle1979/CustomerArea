import type { CustomerInfo, Order } from "./shopify-auth";

const MOCK_EMAIL = "italoarauju2019@gmail.com";

const MOCK_ORDERS: Order[] = [
  {
    id: "gid://shopify/Order/9991516000",
    name: "#TB-1516",
    number: 1516,
    processedAt: "2026-03-12T01:26:00Z",
    note:
      "A pair of extra tires and a complete aluminum wheel with axle and rim\n" +
      "Color: Matte black\n" +
      "Handlebar 400x90\n" +
      "No decals",
    totalPrice: { amount: "1753.00", currencyCode: "USD" },
    lineItems: {
      edges: [
        {
          node: {
            title: "Gravel V3 PRO (Premium Edition) - Full Carbon Gravel Bike",
            quantity: 1,
            image: {
              url: "https://cdn.shopify.com/s/files/1/0587/2982/4417/files/Captura_de_tela_2026-01-27_221936_160x160.png?v=1769563132",
              altText: "Gravel V3 PRO",
            },
          },
        },
        {
          node: {
            title: "Handlebar Option: Standard Carbon (Integrated)",
            quantity: 1,
            image: {
              url: "https://cdn.shopify.com/s/files/1/0587/2982/4417/files/Picture8_2a9849b5-be64-4c9b-9da1-f2c731bcdfa7_160x160.jpg?v=1769554741",
              altText: "Standard Carbon Handlebar",
            },
          },
        },
        {
          node: {
            title: "Wheel: Black Carbon Wheel",
            quantity: 1,
            image: {
              url: "https://cdn.shopify.com/s/files/1/0587/2982/4417/files/download_4_c8956062-4610-4e9f-87a9-53180b40bd21_160x160.webp?v=1769563493",
              altText: "Black Carbon Wheel",
            },
          },
        },
      ],
    },
  },
];

export function withMockOrdersIfMatchingUser(customer: CustomerInfo): CustomerInfo {
  if (customer.emailAddress?.emailAddress !== MOCK_EMAIL) return customer;

  const existing = customer.orders?.edges ?? [];
  const mocked = MOCK_ORDERS.map((node) => ({ node }));

  return {
    ...customer,
    orders: { edges: [...mocked, ...existing] },
  };
}
