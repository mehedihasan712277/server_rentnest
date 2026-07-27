import Stripe from "stripe";
import config from "../config";

export const stripe: Stripe = new Stripe(config.stripe_secret_key!);
// study later why Stripe type is needed here
