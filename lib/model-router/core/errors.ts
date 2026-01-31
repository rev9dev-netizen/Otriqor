export function classifyError(msg: string): string {

  if (/401|invalid.*key/i.test(msg)) return "invalid_key"
  if (/403|forbidden/i.test(msg)) return "not_allowed"
  if (/404|not found/i.test(msg)) return "not_found"
  if (/quota/i.test(msg)) return "quota"
  if (/tier|plan|upgrade/i.test(msg)) return "tier_restricted"
  if (/rate/i.test(msg)) return "rate_limited"

  return "unknown"
}
