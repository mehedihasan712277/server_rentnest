import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";

import { notFound } from "./middleware/notfound";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

// -----------routes import---------
import { userRoutes } from "./modules/user/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRouter } from "./modules/category/category.route";
import { amenityRouter } from "./modules/amenity/amenity.routes";
import { propertyRouter } from "./modules/property/property.route";
import { rentalRequestRouter } from "./modules/rental_request/rental_request.routes";
import { rentalRouter } from "./modules/rental/rental.routes";
import { webhookRoutes } from "./modules/checkout/webhook.routes";
import { paymentRouter } from "./modules/payment/payment.routes";
import { reviewRouter } from "./modules/review/review.routes";
import { getLandingPageHtml } from "./utils/landingPage";

const app: Application = express();

app.use(
    cors({
        origin: config.client_url,
        credentials: true,
    }),
);

app.use("/api/webhook", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.status(200).send(getLandingPageHtml());
});
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRouter);
app.use("/api/amenities", amenityRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/rental-requests", rentalRequestRouter);
app.use("/api/rentals", rentalRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/reviews", reviewRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
