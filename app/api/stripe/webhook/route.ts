import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20"
});

export async function POST(req: NextRequest) {
  // must read raw body for Stripe signature check
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature error", err.message);
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.supabase_user_id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              plan_type: "pro",
              subscription_status: "active",
              stripe_subscription_id: subscriptionId ?? null
            })
            .eq("id", userId);

          if (error) {
            console.error("profiles update error", error);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profileError) {
          console.error("profile lookup error", profileError);
          break;
        }

        if (!profile) break;

        const status = subscription.status;
        const planType = status === "active" ? "pro" : "free";

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            plan_type: planType,
            subscription_status: status,
            stripe_subscription_id: subscription.id
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("subscription status update error", updateError);
        }

        break;
      }

      default:
        // ignore other events for now
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("webhook handler error", err);
    return NextResponse.json(
      { error: "Webhook handler failure" },
      { status: 500 }
    );
  }
}
