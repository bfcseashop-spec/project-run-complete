/** Find the lowest available sequential invoice number (fills gaps from deletions) */
export function getNextInvoiceNumber(existingIds: string[], prefix: string, startNum = 1): number {
  const usedNumbers = new Set<number>();
  const re = new RegExp(`^${prefix}[\\-]?(\\d+)$`, "i");
  for (const id of existingIds) {
    const m = id.match(re);
    if (m) usedNumbers.add(parseInt(m[1], 10));
  }
  let num = startNum;
  while (usedNumbers.has(num)) {
    num++;
  }
  return num;
}
