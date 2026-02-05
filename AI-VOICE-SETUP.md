# AI Voice Booking Agent Setup

The contact page includes an **AI voice calling agent** (powered by [Vapi](https://vapi.ai)) so visitors can book appointments by voice.

## What’s already on the site

- **“Book by Voice”** section on the Contact/Appointment page
- **Floating voice widget** (bottom-right) — hidden until you add your keys
- **Fallback:** “Prefer to call? +91 98704 39934” link

## How to enable the AI voice agent

1. **Create a Vapi account**  
   Go to [dashboard.vapi.ai](https://dashboard.vapi.ai/) and sign up.

2. **Get your Public API Key**  
   In the dashboard: Profile (top right) → **Vapi API Keys** → copy your **Public API Key**.

3. **Create an Assistant for booking**  
   - In the dashboard, go to **Assistants** → **Create Assistant**  
   - Set the assistant to collect: **name**, **phone**, **preferred date**, **preferred time**, **service/concern**  
   - You can use Vapi’s tools to send this data to your email or Formspree  
   - Copy the **Assistant ID** of this assistant

4. **Add keys to your website**  
   In `contact.html`, find the `<vapi-widget>` block and replace:
   - `public-key="YOUR_VAPI_PUBLIC_KEY"` → your Public API Key  
   - `assistant-id="YOUR_VAPI_ASSISTANT_ID"` → your Assistant ID  

5. **Save and upload**  
   Save `contact.html` and push to GitHub (or your host). The floating voice button will appear; users can click it to start a voice call and book.

## Optional: phone number for inbound calls

Vapi can provide a phone number so patients can **call in** (not only use the website widget). See [Vapi Phone Numbers](https://docs.vapi.ai/phone-numbers) and [Free Vapi number](https://docs.vapi.ai/free-telephony).

## Alternatives

- **[Bland AI](https://bland.ai)** — another option for voice agents and phone numbers  
- **[Twilio + OpenAI](https://www.twilio.com)** — build a custom voice bot with your own number  

Once your Vapi keys and Assistant ID are in `contact.html`, the AI voice booking agent is active for your site.
