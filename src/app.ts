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

const app: Application = express();

app.use(
    cors({
        origin: config.app_url,
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RentNest API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            text-align: center;
            max-width: 700px;
            padding: 40px;
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 15px;
        }

        .status {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 8px 16px;
            border-radius: 999px;
            font-weight: bold;
            margin-bottom: 25px;
        }

        p {
            color: #cbd5e1;
            line-height: 1.8;
            margin-bottom: 12px;
        }

        .links {
            margin-top: 30px;
        }

        a {
            color: #38bdf8;
            text-decoration: none;
            margin: 0 12px;
            font-weight: 600;
        }

        a:hover {
            text-decoration: underline;
        }

        footer {
            margin-top: 40px;
            color: #94a3b8;
            font-size: 14px;
        }

        code {
            color: #22c55e;
        }
    </style>
</head>
<body>

<div class="container">

    <h1>🏠 RentNest API</h1>

    <div class="status">
        ✅ API Running
    </div>

    <p>
        A secure and scalable REST API powering the RentNest rental property marketplace.
    </p>

    <p>
        Built with <strong>Express.js</strong>, <strong>TypeScript</strong>,
        <strong>Prisma ORM</strong>, and <strong>PostgreSQL</strong>.
    </p>

    <p>
        Authentication • Property Management • Rental Requests • Payments • Reviews
    </p>

    <div class="links">
        <a href="https://github.com/mehedihasan712277/backend_rentnest" target="_blank">GitHub</a>
    </div>

    <footer>
        Version 1.0.0 • © ${new Date().getFullYear()} RentNest API
    </footer>

</div>

</body>
</html>
    `);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRouter);
app.use("/api/amenities", amenityRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/rental-requests", rentalRequestRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
