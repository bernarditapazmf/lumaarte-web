import crypto from 'crypto';

function secret() {
  return import.meta.env.RESEND_API_KEY ?? 'luma';
}

export function unsubscribeToken(email) {
  return crypto.createHmac('sha256', secret()).update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export function unsubscribeUrl(email) {
  const token = unsubscribeToken(email);
  return `https://www.lumaarte.com/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

export function unsubscribeFooterHtml(email) {
  return `
    <p style="margin-top:32px;font-size:11px;color:rgba(33,31,24,.4);line-height:1.6;text-align:center">
      <a href="${unsubscribeUrl(email)}" style="color:rgba(33,31,24,.4)">Darme de baja de estos correos</a>
    </p>`;
}
