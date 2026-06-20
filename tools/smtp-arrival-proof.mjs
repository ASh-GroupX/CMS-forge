import { pathToFileURL } from 'node:url';

export async function runSmtpArrivalProof({
  env = process.env,
  providerFactory,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  try {
    const to = requiredRecipient(env.SMTP_PROOF_TO);
    const proofId = 'smtp-proof-' + Date.now();
    const createProvider = providerFactory ?? (await defaultProviderFactory());
    const provider = createProvider({ ...env, NODE_ENV: 'production', EMAIL_PROVIDER_DRIVER: 'smtp' });
    const result = await provider.send({
      to,
      subject: `CMS-Auto staging SMTP proof ${proofId}`,
      textBody: `CMS-Auto staging SMTP proof ${proofId}. Record arrival evidence outside the repo.`,
      payload: { proofId },
    });

    stdout.write(JSON.stringify(safeProofResult(proofId, to, result), null, 2) + '\n');
    return 0;
  } catch {
    stderr.write('SMTP arrival proof failed safely. Check staging SMTP configuration, recipient, and provider delivery logs.\n');
    return 1;
  }
}

export async function defaultProviderFactory() {
  const api = await import('../apps/api/src/modules/integrations/email-provider.factory.ts');
  return api.emailProviderFromEnv;
}

export function safeProofResult(proofId, recipient, result) {
  return {
    proofId,
    provider: result.provider,
    recipient: redactEmail(recipient),
    recipientDomain: emailDomain(recipient),
    accepted: Array.isArray(result.accepted) ? result.accepted.map(redactEmail) : [],
    messageIdPresent: typeof result.messageId === 'string' && result.messageId.trim().length > 0,
  };
}

export function redactEmail(value) {
  const email = String(value ?? '').trim();
  const at = email.lastIndexOf('@');
  if (at <= 0) return '[redacted]';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 1)}***@${domain}`;
}

function requiredRecipient(value) {
  const recipient = typeof value === 'string' ? value.trim() : '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient) || /[\r\n]/.test(recipient)) {
    throw new Error('SMTP_PROOF_TO is required');
  }
  return recipient;
}

function emailDomain(value) {
  const email = String(value ?? '').trim();
  const at = email.lastIndexOf('@');
  return at > 0 ? email.slice(at + 1) : '[redacted]';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const status = await runSmtpArrivalProof();
  process.exit(status);
}
