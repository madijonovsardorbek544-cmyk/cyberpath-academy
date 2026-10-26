/** Public profile URL for this deployment (HashRouter, and the GitHub Pages base path when present). */
export function publicProfileUrl(handle: string) {
  return `${window.location.origin}${window.location.pathname}#/u/${encodeURIComponent(handle)}`;
}

/** LinkedIn's "Add licence or certification" prefill link. */
export function linkedInCertificationUrl(name: string, certUrl: string, issuedAt: string) {
  const issued = new Date(issuedAt);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name,
    organizationName: 'CyberPath Academy',
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export function linkedInShareUrl(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
