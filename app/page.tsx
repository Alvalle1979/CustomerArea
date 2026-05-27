import Image from "next/image";

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Missing parameters in Shopify response.",
  invalid_state: "Invalid OAuth state. Please try again.",
  token_exchange_failed: "Could not retrieve access token.",
  access_denied: "You cancelled the login.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login-main">
      <section className="login-hero">
        <div className="login-hero-inner">
          <div className="login-logo">
            <Image
              src="/logo-twitter.png"
              alt="Twitter"
              width={180}
              height={180}
              priority
              className="login-logo-img"
            />
          </div>
          <h1 className="login-hero-title">
            READY TO
            <br />
            <span className="login-hero-accent">RIDE?</span>
          </h1>
          <p className="login-hero-subtitle">
            Access your account to track orders
            <br />
            and see the latest.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-top">
          <span className="login-secure">
            <span className="login-secure-dot" aria-hidden />
            Secure Environment
          </span>
        </div>

        <div className="login-panel-body">
          <h2 className="login-title">LOGIN</h2>
          <p className="login-subtitle">
            You will be redirected to Shopify&rsquo;s
            <br />
            secure login page.
          </p>

          {error && (
            <div className="error login-error">
              {ERROR_MESSAGES[error] ?? `Error: ${error}`}
            </div>
          )}

          <a href="/api/auth/login" className="login-button">
            SIGN IN WITH SHOPIFY
          </a>

          <p className="login-help">
            Don&rsquo;t have an account? It will be created
            <br />
            automatically on your first sign-in.
          </p>
        </div>
      </section>
    </main>
  );
}
