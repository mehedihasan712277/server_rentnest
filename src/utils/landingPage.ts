export const getLandingPageHtml = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RentNest API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet" />
    <style>
        :root {
                --ink-deep: #1e1b4b;
    --ink-panel: #312e81;
    --line: rgba(255, 255, 255, 0.08);
    --line-strong: rgba(255, 255, 255, 0.18);
    --paper: #f8fafc;
    --text: #f9fafb;
    --text-dim: #c7d2fe;
    --accent: #6366f1;
    --live: #22c55e;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.001ms !important;
                transition-duration: 0.001ms !important;
            }
        }

        html, body {
            height: 100%;
        }

        body {
            font-family: 'IBM Plex Sans', sans-serif;
            background-color: var(--ink-deep);
            background-image:
                linear-gradient(var(--line) 1px, transparent 1px),
                linear-gradient(90deg, var(--line) 1px, transparent 1px);
            background-size: 32px 32px;
            color: var(--text);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 20px;
        }

        .sheet {
            width: 100%;
            max-width: 860px;
            border: 1px solid var(--line-strong);
            background: linear-gradient(180deg, rgba(238, 244, 251, 0.03), transparent 40%);
        }

        /* ---- header strip: mimics a drawing sheet's edge label ---- */
        .sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 22px;
            border-bottom: 1px solid var(--line-strong);
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.14em;
            color: var(--text-dim);
            text-transform: uppercase;
        }

        .sheet-header .status-dot {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--live);
            margin-right: 8px;
            box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18);
            animation: pulse 2.4s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
        }

        /* ---- hero ---- */
        .hero {
            padding: 56px 40px 40px;
            text-align: center;
            border-bottom: 1px dashed var(--line-strong);
        }

        .hero .eyebrow {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.22em;
            color: var(--brass);
            text-transform: uppercase;
            margin-bottom: 18px;
        }

        .hero h1 {
            font-family: 'IBM Plex Mono', monospace;
            font-weight: 600;
            font-size: clamp(2.4rem, 6vw, 3.4rem);
            letter-spacing: -0.01em;
            line-height: 1.05;
        }

        .hero p {
            margin: 20px auto 0;
            max-width: 480px;
            color: var(--text-dim);
            font-size: 15px;
            line-height: 1.65;
        }

        /* ---- floor plan: modules as rooms ---- */
        .plan {
            padding: 36px 40px;
            border-bottom: 1px dashed var(--line-strong);
        }

        .plan-label {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.14em;
            color: var(--text-dim);
            text-transform: uppercase;
            margin-bottom: 18px;
        }

        .rooms {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 1px;
            background: var(--line-strong);
            border: 1px solid var(--line-strong);
        }

        .room {
            background: var(--ink-deep);
            padding: 16px 14px;
            min-height: 84px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: background 0.2s ease;
        }

        .room:hover {
            background: var(--ink-panel);
        }

        .room .count {
            align-self: flex-end;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 10px;
            color: var(--text-dim);
        }

        .room .name {
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.01em;
        }

        @media (max-width: 640px) {
            .rooms { grid-template-columns: repeat(2, 1fr); }
            .hero { padding: 44px 24px 32px; }
            .plan { padding: 28px 24px; }
        }

        /* ---- title block: architectural drawing corner stamp ---- */
        .title-block {
            padding: 24px 40px 30px;
            display: flex;
            justify-content: flex-end;
        }

        .stamp {
            border: 1px solid var(--line-strong);
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11.5px;
        }

        .stamp-row {
            display: grid;
            grid-template-columns: 116px 1fr;
        }

        .stamp-row + .stamp-row {
            border-top: 1px solid var(--line-strong);
        }

        .stamp-row .k {
            padding: 8px 12px;
            color: var(--text-dim);
            border-right: 1px solid var(--line-strong);
            letter-spacing: 0.08em;
        }

        .stamp-row .v {
            padding: 8px 12px;
            color: var(--text);
        }

        .stamp-row .v a {
            color: var(--paper);
            text-decoration: none;
            border-bottom: 1px solid var(--brass);
        }

        .stamp-row .v a:hover,
        .stamp-row .v a:focus-visible {
            color: var(--brass);
        }

        .stamp-row .v a:focus-visible {
            outline: 2px solid var(--brass);
            outline-offset: 2px;
        }
    </style>
</head>
<body>

    <main class="sheet">

        <div class="sheet-header">
            <span><span class="status-dot"></span>Operational</span>
            <span>Drawing No. RN&#8209;API&#8209;01</span>
        </div>

        <section class="hero">
            <div class="eyebrow">Property Rental Marketplace &mdash; Backend</div>
            <h1>RentNest API</h1>
            <p>
                REST API for listing properties, managing rental requests, and
                billing tenants automatically every month via Stripe subscriptions.
            </p>
        </section>

        <section class="plan">
            <div class="plan-label">Floor Plan &mdash; Modules</div>
            <div class="rooms">
                <div class="room"><span class="count">05</span><span class="name">Auth</span></div>
                <div class="room"><span class="count">05</span><span class="name">Users</span></div>
                <div class="room"><span class="count">05</span><span class="name">Categories</span></div>
                <div class="room"><span class="count">04</span><span class="name">Amenities</span></div>
                <div class="room"><span class="count">08</span><span class="name">Properties</span></div>
                <div class="room"><span class="count">08</span><span class="name">Rental Requests</span></div>
                <div class="room"><span class="count">04</span><span class="name">Rentals &amp; Billing</span></div>
                <div class="room"><span class="count">03</span><span class="name">Payments</span></div>
                <div class="room"><span class="count">07</span><span class="name">Reviews</span></div>
                <div class="room"><span class="count">01</span><span class="name">Stripe Webhook</span></div>
            </div>
        </section>

        <section class="title-block">
            <div class="stamp">
                <div class="stamp-row">
                    <div class="k">SERVICE</div>
                    <div class="v">RentNest API</div>
                </div>
                <div class="stamp-row">
                    <div class="k">VERSION</div>
                    <div class="v">1.0.0</div>
                </div>
                <div class="stamp-row">
                    <div class="k">STACK</div>
                    <div class="v">Node &middot; Express &middot; Prisma &middot; PostgreSQL</div>
                </div>
                <div class="stamp-row">
                    <div class="k">REPOSITORY</div>
                    <div class="v"><a href="https://github.com/mehedihasan712277/server_rentnest" target="_blank" rel="noopener">github.com/mehedihasan712277/server_rentnest</a></div>
                </div>
                <div class="stamp-row">
                    <div class="k">&copy; ${new Date().getFullYear()}</div>
                    <div class="v">Md. Mehedi Hasan</div>
                </div>
            </div>
        </section>

    </main>

</body>
</html>
`;
