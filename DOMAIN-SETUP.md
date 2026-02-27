# Add a custom domain to your site (GitHub Pages)

Your site is hosted from this repo. Follow these steps to use your own domain (e.g. `drsonalshah.com` or `www.drsonalshah.com`).

---

## 1. Turn on GitHub Pages (if not already)

1. Open your repo: **https://github.com/sakshamtikekar19/Dr-Sonal-shah-Cosmetica-India**
2. Go to **Settings** → **Pages** (left sidebar).
3. Under **Source**, choose **Deploy from a branch**.
4. Under **Branch**, select **main** and folder **/ (root)**. Save.

Your site will be at:  
`https://sakshamtikekar19.github.io/Dr-Sonal-shah-Cosmetica-India/`

---

## 2. Add your custom domain in GitHub

1. Still in **Settings** → **Pages**.
2. In **Custom domain**, type your domain (e.g. `www.drsonalshah.com` or `drsonalshah.com`).
3. Click **Save**.
4. If GitHub shows **Enforce HTTPS**, enable it after DNS has propagated (step 3).

---

## 3. Point your domain to GitHub (DNS)

Log in to where you bought the domain (GoDaddy, Namecheap, Google Domains, etc.) and add DNS records as below.

### Option A: Use a **subdomain** (e.g. `www.drsonalshah.com`)

| Type  | Name | Value |
|-------|------|--------|
| CNAME | www  | `sakshamtikekar19.github.io` |

- **Name:** `www` (or leave “host” as www).
- **Value / Target:** `sakshamtikekar19.github.io` (no `https://`, no path).

### Option B: Use **apex/root** (e.g. `drsonalshah.com`)

Add these **A** records (IPs are GitHub’s):

| Type | Name | Value      |
|------|------|------------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

(Some registrars use “@” for “root”; others leave Name blank for root.)

Optional: if you also want `www` to work, add a CNAME: Name `www` → `sakshamtikekar19.github.io`.

---

## 4. CNAME file (for GitHub Pages)

- If your custom domain is a **subdomain** (e.g. `www.drsonalshah.com`), add a file named **CNAME** in the **root** of this repo (same level as `index.html`) with one line: your domain only, e.g.  
  `www.drsonalshah.com`
- If you use **apex only** (e.g. `drsonalshah.com`), you usually **do not** add a CNAME file; GitHub will show the correct setup in Settings → Pages.

After you add CNAME, commit and push so GitHub uses your domain.

---

## 5. Wait and then turn on HTTPS

- DNS can take from a few minutes up to 24–48 hours.
- In GitHub **Settings** → **Pages**, when the domain is detected, **Enforce HTTPS** will become available. Turn it on.

---

## Quick checklist

- [ ] GitHub Pages enabled (branch: main, root).
- [ ] Custom domain entered in Settings → Pages.
- [ ] DNS records added at your registrar (CNAME for www, or A records for apex).
- [ ] CNAME file in repo root if using www (and push to main).
- [ ] After DNS propagates: Enforce HTTPS enabled.

If you tell me your exact domain (e.g. `drsonalshah.com` or `www.drsonalshah.com`), I can give you the exact CNAME content and DNS table for your case.
