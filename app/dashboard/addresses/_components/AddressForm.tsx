import type { MailingAddress } from "@/lib/shopify-auth";

type FormAction = (formData: FormData) => void | Promise<void>;

export function AddressForm({
  action,
  address,
  isDefault,
  submitLabel,
  cancelHref,
  error,
}: {
  action: FormAction;
  address?: MailingAddress | null;
  isDefault?: boolean;
  submitLabel: string;
  cancelHref: string;
  error?: string;
}) {
  const v = (key: keyof MailingAddress) =>
    (address?.[key] as string | null | undefined) ?? "";

  return (
    <form action={action} className="tb-form">
      {error && (
        <div
          className="tb-form-error"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "0.75rem 1rem",
            borderRadius: 6,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div className="tb-form-grid">
        <label className="tb-form-field">
          <span className="tb-form-label">First name</span>
          <input
            type="text"
            name="firstName"
            defaultValue={v("firstName")}
            className="tb-form-input"
            autoComplete="given-name"
          />
        </label>
        <label className="tb-form-field">
          <span className="tb-form-label">Last name</span>
          <input
            type="text"
            name="lastName"
            defaultValue={v("lastName")}
            className="tb-form-input"
            autoComplete="family-name"
          />
        </label>

        <label className="tb-form-field tb-form-field-full">
          <span className="tb-form-label">Company (optional)</span>
          <input
            type="text"
            name="company"
            defaultValue={v("company")}
            className="tb-form-input"
            autoComplete="organization"
          />
        </label>

        <label className="tb-form-field tb-form-field-full">
          <span className="tb-form-label">Address line 1</span>
          <input
            type="text"
            name="address1"
            defaultValue={v("address1")}
            className="tb-form-input"
            autoComplete="address-line1"
            required
          />
        </label>

        <label className="tb-form-field tb-form-field-full">
          <span className="tb-form-label">Address line 2 (optional)</span>
          <input
            type="text"
            name="address2"
            defaultValue={v("address2")}
            className="tb-form-input"
            autoComplete="address-line2"
          />
        </label>

        <label className="tb-form-field">
          <span className="tb-form-label">City</span>
          <input
            type="text"
            name="city"
            defaultValue={v("city")}
            className="tb-form-input"
            autoComplete="address-level2"
            required
          />
        </label>
        <label className="tb-form-field">
          <span className="tb-form-label">State / Province code</span>
          <input
            type="text"
            name="zoneCode"
            defaultValue={v("zoneCode")}
            className="tb-form-input"
            autoComplete="address-level1"
            placeholder="e.g. CA, NY, SP"
          />
        </label>
        <label className="tb-form-field">
          <span className="tb-form-label">ZIP / Postal code</span>
          <input
            type="text"
            name="zip"
            defaultValue={v("zip")}
            className="tb-form-input"
            autoComplete="postal-code"
          />
        </label>
        <label className="tb-form-field">
          <span className="tb-form-label">Country code</span>
          <input
            type="text"
            name="territoryCode"
            defaultValue={v("territoryCode")}
            className="tb-form-input"
            autoComplete="country"
            placeholder="e.g. US, BR, CA"
            required
          />
        </label>

        <label className="tb-form-field tb-form-field-full">
          <span className="tb-form-label">Phone number</span>
          <input
            type="tel"
            name="phoneNumber"
            defaultValue={v("phoneNumber")}
            className="tb-form-input"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
          />
        </label>

        <label className="tb-form-check tb-form-field-full">
          <input
            type="checkbox"
            name="setAsDefault"
            defaultChecked={isDefault ?? false}
          />
          <span>Set as default address</span>
        </label>
      </div>

      <div className="tb-form-actions">
        <a href={cancelHref} className="tb-btn-ghost">
          Cancel
        </a>
        <button type="submit" className="tb-btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
