import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking trial status");
      
      // Get user's company and trial status
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        // Get trial status
        const { data: trialStatus } = await supabaseClient
          .rpc('get_trial_status', { company_id_param: profile.company_id });

        logStep("Trial status retrieved", trialStatus);

        if (trialStatus?.is_trial_active) {
          // Active trial - update company with trial features
          await supabaseClient
            .from('companies')
            .update({
              subscription_tier: 'trial',
              subscription_status: 'trial',
              subscription_features: {
                version_control: true,
                collaboration: true,
                advanced_analytics: false,
                time_tracking: false,
              },
              subscription_expires_at: trialStatus.trial_ends_at,
            })
            .eq('id', profile.company_id);

          return new Response(JSON.stringify({ 
            subscribed: false,
            subscription_tier: 'trial',
            subscription_end: trialStatus.trial_ends_at,
            trial_info: {
              is_trial: true,
              is_trial_active: true,
              days_remaining: trialStatus.days_remaining,
              trial_ends_at: trialStatus.trial_ends_at
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          // Trial expired - update to free tier
          await supabaseClient
            .from('companies')
            .update({
              subscription_tier: 'free',
              subscription_status: 'trial_expired',
              subscription_features: {
                version_control: false,
                collaboration: false,
                advanced_analytics: false,
                time_tracking: false,
              },
              subscription_expires_at: null,
            })
            .eq('id', profile.company_id);

          return new Response(JSON.stringify({ 
            subscribed: false, 
            subscription_tier: 'free',
            subscription_end: null,
            trial_info: {
              is_trial: false,
              is_trial_active: false,
              trial_expired: true,
              days_remaining: 0,
              trial_ends_at: trialStatus?.trial_ends_at
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      // Fallback for companies without trial data
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'free',
        subscription_end: null,
        trial_info: {
          is_trial: false,
          is_trial_active: false,
          trial_expired: false,
          days_remaining: 0
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount >= 39999) {
        subscriptionTier = "enterprise";
      } else if (amount >= 9999) {
        subscriptionTier = "pro";
      } else if (amount >= 6999) {
        subscriptionTier = "free"; // This is actually Basic now
      } else {
        subscriptionTier = "free";
      }
      
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    // Update company subscription info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profile?.company_id) {
      const features = {
        version_control: hasActiveSub,
        collaboration: hasActiveSub,
        advanced_analytics: subscriptionTier === 'pro' || subscriptionTier === 'enterprise',
        time_tracking: subscriptionTier === 'pro' || subscriptionTier === 'enterprise',
        scheduling: subscriptionTier === 'pro' || subscriptionTier === 'enterprise',
      };

      await supabaseClient
        .from('companies')
        .update({
          subscription_tier: subscriptionTier,
          subscription_status: hasActiveSub ? 'active' : 'cancelled',
          subscription_features: features,
          subscription_expires_at: subscriptionEnd,
        })
        .eq('id', profile.company_id);
    }

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      trial_info: {
        is_trial: false,
        is_trial_active: false,
        trial_expired: false,
        days_remaining: 0
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR in check-subscription: Subscription check failed");
    return new Response(JSON.stringify({ error: "Unable to check subscription status. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});