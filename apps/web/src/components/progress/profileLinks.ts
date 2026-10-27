/** Public profile URL for this deployment (HashRouter, and the GitHub Pages base path when present). */
export function publicProfileUrl(handle: string) {
  return `${window.location.origin}${window.location.pathname}#/u/${encodeURIComponent(handle)}`;
}

/** Public page where anyone can check an exam certificate code. */
export function certificateVerifyUrl(code: string) {
  return `${window.location.origin}${window.location.pathname}#/verify/${encodeURIComponent(code)}`;
}

/** LinkedIn's "Add licence or certification" prefill link. */
export function linkedInCertificationUrl(name: string, certUrl: string, issuedAt: string, certId?: string) {
  const issued = new Date(issuedAt);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name,
    organizationName: 'CyberPath Academy',
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl,
    ...(certId ? { certId } : {})
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export function linkedInShareUrl(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
