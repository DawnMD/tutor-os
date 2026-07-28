// Client-only helper to load Razorpay Standard Checkout on demand. The script
// injects `window.Razorpay`; we resolve once it's ready so the Pay button can
// await it. Loaded lazily (not in <head>) so it costs nothing on pages that
// never open checkout.

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler?: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
}

export type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loader: Promise<RazorpayConstructor> | null = null;

/** Resolve the `Razorpay` constructor, injecting the checkout script once. */
export function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay checkout is only available in the browser."),
    );
  }
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (loader) {
    return loader;
  }

  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const onReady = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay checkout failed to initialize."));
    };
    const onError = () => {
      // Allow a later retry to re-attempt the load.
      loader = null;
      reject(new Error("Failed to load Razorpay checkout."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", onError);
      return;
    }

    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.addEventListener("load", onReady);
    script.addEventListener("error", onError);
    document.body.appendChild(script);
  });

  return loader;
}
