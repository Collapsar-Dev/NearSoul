import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
}

/** Transactional email behind an interface (D10). Console driver is dev/test only (enforced in env.ts). */
@Injectable()
export class EmailService {
  private readonly logger = new Logger('Email');
  /** Last messages per recipient, kept only in development/test for local login and tests. */
  readonly outbox = new Map<string, OutgoingEmail>();

  async send(mail: OutgoingEmail): Promise<void> {
    const e = env();
    if (e.EMAIL_PROVIDER === 'console') {
      this.outbox.set(mail.to, mail);
      if (e.APP_ENV === 'development') this.logger.log(`[dev email] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
      return;
    }
    if (e.EMAIL_PROVIDER === 'brevo') {
      const m = /^(.*)<(.+)>$/.exec(e.EMAIL_FROM.trim());
      const sender = m ? { name: m[1]!.trim(), email: m[2]!.trim() } : { name: 'NearSoul', email: e.EMAIL_FROM.trim() };
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': e.BREVO_API_KEY ?? '', 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender, to: [{ email: mail.to }], subject: mail.subject, textContent: mail.text }),
      });
      if (!r.ok) {
        this.logger.error(`Email provider error status=${r.status}`);
        throw new Error('EMAIL_SEND_FAILED');
      }
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${e.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: e.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    if (!res.ok) {
      this.logger.error(`Email provider error status=${res.status}`);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }
}
