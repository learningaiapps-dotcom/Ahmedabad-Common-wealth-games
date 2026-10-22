# Ahmedabad Games Connect

Visitor help app for the Commonwealth Games in Ahmedabad: nearby facilities, events, places to see, how to reach venues, help lines, parking, food vendor registration, volunteer and parking-space rental forms, hazard reports with photos, and an admin page.

Built with React (Vite) and Supabase. Hosted free on Render as a static site.

## What you need (all free to start)
- A GitHub account
- A Supabase account (supabase.com)
- A Render account (render.com)

---

## Step 1. Create the database on Supabase
1. In Supabase click **New project**. Give it a name and a strong database password. Choose the region closest to India (for example Mumbai). Wait a minute for it to finish.
2. Left menu: **SQL Editor** > **New query**.
3. Open the file `supabase/schema.sql` from this project, copy everything, paste it in, and press **Run**. It should say "Success".

## Step 2. Copy your two keys
1. In Supabase go to **Project Settings** > **API**.
2. Copy the **Project URL** and the **anon public key**. You will paste these into Render in Step 5.
3. Never share the **service_role** key with anyone and never put it in this app.

## Step 3. Create your admin login
1. In Supabase go to **Authentication** > **Users** > **Add user** > **Create new user**. Enter your email and a strong password. Tick "Auto Confirm User".
2. Go back to **SQL Editor** and run this (change the email to yours):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'YOUR_EMAIL_HERE';
```
3. Only people listed in the `admins` table can use the Admin page, so extra sign-ups are harmless. If this Supabase project is used only for this app, you may also turn OFF "Allow new users to sign up" under **Authentication** > **Sign In / Providers**. Do NOT turn it off if the project is shared with another app that needs sign-ups.

## Step 4. Put the project on GitHub
1. On github.com click **New repository**. Name it `ahmedabad-games-connect`. Keep it Private if you like.
2. Click **uploading an existing file**. Unzip this project on your computer and drag in all files and folders (`src`, `supabase`, `package.json`, `index.html`, `vite.config.js`, `render.yaml`, `.gitignore`, `.env.example`, `README.md`).
3. Do not upload `node_modules`, `dist` or any `.env` file. Click **Commit changes**.

## Step 5. Launch on Render
1. In Render click **New +** > **Static Site** and connect your GitHub repository.
2. Settings:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. Under **Environment Variables** add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. Click **Create Static Site**. After a few minutes you get a link like `https://ahmedabad-games-connect.onrender.com`.

If you change the two environment variables later, press **Manual Deploy** so the app rebuilds.

## Step 6. Test it
1. Open your Render link on your phone. Submit a test hazard report with a photo.
2. Scroll to the bottom of the home page and tap **Admin**. Log in with the admin email and password from Step 3.
3. You should see the report, be able to view the photo, mark it approved or resolved, and add special help numbers on the **help numbers** tab. Numbers added there appear on the Help Lines page for every visitor.

---

## Map and weather (no extra keys needed)
- **Map:** a real OpenStreetMap map using Leaflet. Switch layers on and off (venues, places, hotels, toilets, water, help, food, charging, ATM). Tap a dot for a Directions link. Map data (c) OpenStreetMap contributors, and the credit is shown on the map.
- **Weather:** Ahmedabad only (23.0225, 72.5714). Uses the free Open-Meteo ECMWF forecast for temperature, wind speed (10 m and 100 m) and solar radiation, for the next 3 days. No API key is needed. The code is in `src/Weather.jsx`.
- Open-Meteo's free service is for non-commercial use and needs a credit link (already shown on the Weather page). If the app is run commercially or gets very heavy traffic, Open-Meteo offers a paid plan.
- OpenStreetMap's own tile server is meant for light use. If you expect heavy traffic during the Games, switch to a tile provider with a free tier plus a key, and change the one line `tileLayer(...)` in `src/LeafletMap.jsx`.

## How the data is protected
- Visitors can only add submissions. They cannot read other people's data.
- Only users listed in the `admins` table can read, change or delete submissions and photos.
- Hazard photos are stored in a private bucket (images only, max 2 MB). Admins open them through a link that expires in 5 minutes.
- Submissions always start with status "new". Only admins can approve.

## Before a public launch
- Replace the sample data in `src/data.js` (places, events, ATMs, hotels, transport notes) with official verified information. Replace the photo placeholders with real photos you have rights to use.
- Hazard reports need a staffed team watching the Admin page, or connected to the official control room. Reports are not a replacement for calling 112.
- Vehicle numbers, phone numbers and licence numbers are personal data. Add a privacy notice and decide how long to keep them. Delete old records from the Admin page.
- Confirm with the authorities who approves street food vendors and parking rentals, and add their rules to the forms.
- Supabase free projects pause after a week of no activity. Upgrade or visit the project regularly before the Games.

## Changing things later
- Text and translations: `src/i18n.js`
- Places, events, hotels, help numbers (built in): `src/data.js`
- Form fields: `src/forms.js` (and the matching columns in `supabase/schema.sql`)
- Colours and layout: `src/styles.css`
- Map: `src/LeafletMap.jsx`, weather: `src/Weather.jsx`

## Run on your own computer (optional)
```
npm install
copy .env.example to .env and fill in the two values
npm run dev
```
