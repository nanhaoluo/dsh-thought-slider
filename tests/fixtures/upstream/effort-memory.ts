// Excerpt from dsh-better-reasoning-effort 0.5.4; see LICENSE and README.md.
export function isSelectRefusal(outcome: unknown): boolean {
  return typeof outcome === 'object' && outcome !== null && (outcome as { ok?: unknown }).ok === false
}

/**
 * The user-facing message of a refusal result, or undefined when the outcome
 * was accepted. Only 0.1.6-alpha.2's resolved shape carries one; a kernel that
 * rejects by throwing never reaches here.
 * @param outcome - the value `select` resolved with.
 * @returns `code: message`, or undefined when accepted.
 */
export function selectRefusalMessage(outcome: unknown): string | undefined {
  if (!isSelectRefusal(outcome)) return undefined
  const error = (outcome as { error?: { code?: unknown; message?: unknown } }).error
  const code = typeof error?.code === 'string' ? error.code : 'settings/rejected'
  const message = typeof error?.message === 'string' ? error.message : ''
  return message.length > 0 ? `${code}: ${message}` : code
}

