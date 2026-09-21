let counter = 1249;

export function generateScreeningId() {
  const year = 2026;
  const idNum = String(counter++).padStart(4, '0');
  return `VS-${year}-${idNum}`;
}

export function generateAuditHash() {
  const chars = '0123456789ABCDEF';
  let hash = '0x';
  for (let i = 0; i < 32; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}
