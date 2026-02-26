# Reviews with Supabase

Reviews submitted on the website are stored in Supabase and **shown to everyone** on the Reviews page.

## One-time setup

1. **Create the table**  
   In **Supabase Dashboard** → **SQL Editor**, run the contents of **`supabase-reviews-table.sql`**.  
   This creates the `reviews` table and allows anyone to read and submit reviews.

2. **Config**  
   The Reviews page uses the same **booking-config.js** (Supabase URL and anon key) as the booking form. No extra config needed.

## How it works

- **Submit:** When someone fills the “Leave a Review” form and clicks Submit, the review is saved to Supabase and appears in the “What Patients Say” section.
- **Display:** The Reviews page loads reviews from Supabase (newest first) and replaces the default static reviews when there is at least one row in the table.
- **Fallback:** If Supabase is not set up or the table is empty, the page shows the existing static reviews.

## Optional: moderate or delete reviews

To allow only an admin to delete reviews, uncomment and run the “Allow delete for authenticated” policy in `supabase-reviews-table.sql`. Then delete unwanted reviews from **Supabase Dashboard** → **Table Editor** → **reviews**.
