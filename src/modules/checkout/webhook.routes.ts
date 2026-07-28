import express, { Router } from "express";
import { webhookController } from "./webhook.controller";

const router = Router();

// IMPORTANT: Stripe needs the raw request body (Buffer) to verify the
// signature, so this route uses express.raw() instead of express.json().
// This route must be mounted in app.ts BEFORE any global express.json()
// middleware runs, otherwise the body will already be parsed/consumed.
router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    webhookController.handleStripeWebhook,
);

export const webhookRoutes = router;
