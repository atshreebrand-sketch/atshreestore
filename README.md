# ATSHREE Store

Modern Indian ethnic-wear storefront for Vercel.

## Included now
- Responsive ATSHREE storefront
- Men/Women category filtering
- Product detail pages
- Size-aware shopping bag
- Quantity controls and free-shipping threshold
- Customer checkout form
- Razorpay order creation endpoint
- Razorpay payment-signature verification endpoint
- Payment success page
- Shipping / returns / privacy / terms / refund pages
- Vercel API routing

## Required before accepting live payments
Set these Vercel Environment Variables for the production project:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Never put `RAZORPAY_KEY_SECRET` in browser JavaScript or GitHub source.

## Production data still needs a database
The current success page records the last order in the customer's browser so the frontend flow can be tested. For real business operations, connect a server-side database such as Supabase/Postgres for orders, customers, inventory and admin access before launch.

## Deployment
Vercel can deploy this repository directly. After changing environment variables, redeploy the production deployment.

## Launch checklist
1. Add Razorpay live/test keys in Vercel.
2. Test successful and failed payments.
3. Connect Supabase/Postgres for permanent orders and inventory.
4. Add authenticated admin dashboard.
5. Configure shipping provider and transactional email/WhatsApp.
6. Replace placeholder legal language with reviewed final policies.
7. Replace demo/stock photography with owned or properly licensed ATSHREE product photography.
