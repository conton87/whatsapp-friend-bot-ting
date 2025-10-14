# WhatsApp Friend Botting

This project provides a tiny Node.js server that accepts form submissions and forwards them to WhatsApp via Twilio's API. It serves a simple HTML form so you can test the flow locally.

## Prerequisites

- Node.js 18+
- A Twilio account with WhatsApp sandbox or a configured WhatsApp sender

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and add your Twilio credentials:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with:
   - `TWILIO_ACCOUNT_SID` – your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` – your Twilio Auth Token
   - `TWILIO_WHATSAPP_FROM` – the WhatsApp-enabled Twilio number (e.g. `+14155238886` for the sandbox)
   - `TWILIO_WHATSAPP_TO` – the WhatsApp number to receive messages (include country code)
   - `PORT` *(optional)* – port for the web server, defaults to `3000`

## Running the server

```bash
npm start
```

Then visit [http://localhost:3000](http://localhost:3000) to submit the form. When the form is submitted, the server will post a WhatsApp message containing the submitted name, email, and message body.

If you want automatic restarts while developing:

```bash
npm run dev
```

## Endpoint reference

- `POST /submit` – accepts JSON body with `name`, `email`, and `message`. Returns a JSON payload with the Twilio message SID on success.

## Notes

- Make sure the destination WhatsApp number has joined your Twilio sandbox (if using the sandbox) before sending messages.
- Errors while sending (for example incorrect credentials) are returned with HTTP status `500`.
