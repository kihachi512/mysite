# Guaranteed Revenue Writing Platform Blueprint

This document captures a sustainable way to deliver a "write and always earn" experience without requiring the operator to subsidize every post. The focus is on predictable micro-rewards that keep writers motivated while keeping the business solvent.

## Core Principles
- **Guaranteed per-post payout**: Every eligible post earns a baseline amount (e.g., \u00a53-\u00a550) so writers feel immediately rewarded.
- **Revenue-funded, not operator-funded**: All payouts are backed by advertising, sponsorship, and pooled user contributions, never by the operator's wallet.
- **Daily balancing**: Payout pools reset and distribute once per day so liabilities never outgrow available revenue.

## Revenue Streams
1. **Display/inline ads** (YouTube-style): Allocate a portion of daily ad revenue into the payout pool; treat impressions as the cost basis instead of post quality.
2. **AI sponsor slots**: Automatically append small AI-generated sponsor blurbs to each post; share a fixed \u00a51-\u00a55 per impression/click to the daily pool.
3. **Pooled tips/donations**: Aggregate voluntary user tips for the day and divide them among all participants; popular posts can still receive direct bonuses on top.

## Daily Distribution Model (Hybrid of AI sponsor + pooled tips)
1. **Collect revenue**: Sum yesterday's ad revenue, AI sponsor payouts, and community tips into a single daily pool.
2. **Guarantee baseline**: Divide a configurable percentage (e.g., 70%) of the pool evenly across all eligible posts to provide the "always pays" experience.
3. **Performance bonus**: Allocate the remaining pool based on lightweight signals (views, likes, completion rate) to reward engagement without disqualifying low-traffic posts.
4. **Safety rails**: Cap per-user daily earnings and enforce one eligible post per user per day to avoid drain attacks and to keep the guarantee credible.

## Data Model (DynamoDB-friendly)
- **Users**: `userId`, profile, payout method, fraud flags.
- **Posts**: `postId`, `userId`, content metadata, `createdAt`, eligibility status.
- **DailyPools**: `date`, `adRevenue`, `aiSponsorRevenue`, `tipsTotal`, `baselinePercentage`, `bonusPercentage`.
- **Payouts**: `payoutId`, `userId`, `postId`, `date`, `baselineAmount`, `bonusAmount`, `status`.
- **Metrics**: per-post engagement counters for lightweight bonuses.

## Payout Algorithm (Daily Batch)
1. Query eligible posts for the day and count them.
2. Fetch `DailyPools` revenue totals; compute `baselinePool` and `bonusPool` shares.
3. Calculate `baselinePerPost = baselinePool / postCount` (floor/round to match currency minor units).
4. Score posts for bonuses using capped metrics; allocate `bonusPool` proportionally.
5. Write `Payouts` entries atomically; mark posts as settled.
6. Publish per-user payout summaries and trigger transfer via Stripe/PayPay for Business if thresholds are met.

## Architecture (Next.js + AWS)
- **App**: Next.js frontend for posting and viewing payouts.
- **API**: Next.js API routes or Lambda for post submission, metrics collection, and payout summaries.
- **Data**: DynamoDB tables above; S3 for media; CloudWatch Events (or EventBridge Scheduler) for the nightly payout Lambda.
- **Payments**: Stripe/PayPay for Business connected accounts for withdrawals; ledger table for audit.

## Abuse Mitigations
- Rate-limit one eligible post per user per day; require minimum length (e.g., 1,000 characters).
- Detect bot traffic on sponsor/tip interactions; exclude flagged impressions from pools.
- Cap maximum daily earnings per user; hold payouts for review on anomalies.

## Example Daily Flow
1. The system records \u00a575,000 in ads + \u00a520,000 in AI sponsors + \u00a55,000 in tips.
2. 1,000 eligible posts exist. Baseline pool (70%) distributes \u00a567,500 \u2192 \u00a567.5 per post.
3. Bonus pool (30%) distributes \u00a532,500 based on engagement; popular posts see upside without reducing the guarantee.
4. Users see next-day balances and can cash out once they hit the minimum transfer threshold.
