const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

const normalize = (value, maxLength = 500) => String(value ?? '')
  .replace(/[\u0000-\u001F\u007F]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('Origin');
    const requestOrigin = new URL(request.url).origin;
    if (origin && origin !== requestOrigin) {
      return jsonResponse({ success: false, message: 'Zahtjev nije dopušten.' }, 403);
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_RECIPIENT || !env.CONTACT_FROM_EMAIL) {
      console.error('Missing RESEND_API_KEY, CONTACT_RECIPIENT or CONTACT_FROM_EMAIL environment variable.');
      return jsonResponse({ success: false, message: 'Kontakt forma još nije završno povezana. Pokušajte ponovno kasnije.' }, 503);
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return jsonResponse({ success: false, message: 'Neispravan format zahtjeva.' }, 415);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 25000) {
      return jsonResponse({ success: false, message: 'Poslani podaci su preveliki.' }, 413);
    }

    const body = await request.json();

    // Hidden honeypot field: silently accept obvious bot submissions without sending an email.
    if (normalize(body.website, 200)) {
      return jsonResponse({ success: true });
    }

    const parentName = normalize(body.parent_name, 100);
    const phone = normalize(body.phone, 30);
    const email = normalize(body.email, 160).toLowerCase();
    const eventDate = normalize(body.event_date, 30);
    const childrenCount = normalize(body.children_count, 10);
    const selectedPackage = normalize(body.package, 80);
    const message = normalize(body.message, 2000);
    const consent = normalize(body.consent, 20);

    if (parentName.length < 2 || phone.length < 6 || !isValidEmail(email) || consent !== 'accepted') {
      return jsonResponse({ success: false, message: 'Provjerite obavezna polja i pokušajte ponovno.' }, 400);
    }

    const subjectName = parentName.replace(/[\r\n]/g, ' ').slice(0, 80);
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#1f2937;line-height:1.6">
        <h1 style="font-size:24px;margin:0 0 18px;color:#111827">Novi upit za SkyKids rođendan</h1>
        <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden">
          <tr><td style="padding:10px 14px;font-weight:700;width:38%;border-bottom:1px solid #e5e7eb">Ime i prezime</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">${escapeHtml(parentName)}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e5e7eb">Telefon</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e5e7eb">E-mail</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e5e7eb">Željeni datum</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">${escapeHtml(eventDate || 'Nije naveden')}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e5e7eb">Broj djece</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">${escapeHtml(childrenCount || 'Nije naveden')}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700">Paket</td><td style="padding:10px 14px">${escapeHtml(selectedPackage || 'Nije odabran')}</td></tr>
        </table>
        <h2 style="font-size:18px;margin:22px 0 8px">Poruka</h2>
        <div style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:12px">${escapeHtml(message || 'Nema dodatne poruke.')}</div>
        <p style="margin-top:20px;font-size:13px;color:#6b7280">Upit je poslan putem kontakt forme na SkyKids web stranici. Klikom na „Odgovori” odgovarate izravno pošiljatelju.</p>
      </div>`;

    const text = [
      'Novi upit za SkyKids rođendan',
      '',
      `Ime i prezime: ${parentName}`,
      `Telefon: ${phone}`,
      `E-mail: ${email}`,
      `Željeni datum: ${eventDate || 'Nije naveden'}`,
      `Broj djece: ${childrenCount || 'Nije naveden'}`,
      `Paket: ${selectedPackage || 'Nije odabran'}`,
      '',
      'Poruka:',
      message || 'Nema dodatne poruke.'
    ].join('\n');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_RECIPIENT],
        reply_to: email,
        subject: `Novi SkyKids upit – ${subjectName}`,
        html,
        text
      })
    });

    if (!emailResponse.ok) {
      const providerError = await emailResponse.text();
      console.error('Email provider error:', emailResponse.status, providerError);
      return jsonResponse({ success: false, message: 'Upit trenutno nije moguće poslati. Pokušajte ponovno ili nas kontaktirajte telefonom.' }, 502);
    }

    return jsonResponse({ success: true, message: 'Upit je uspješno poslan.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return jsonResponse({ success: false, message: 'Došlo je do pogreške. Pokušajte ponovno ili nas kontaktirajte telefonom.' }, 500);
  }
}

export function onRequestGet() {
  return jsonResponse({ success: false, message: 'Metoda nije dopuštena.' }, 405);
}
