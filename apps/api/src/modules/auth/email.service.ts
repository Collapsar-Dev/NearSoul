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
