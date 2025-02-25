/**
 * FNV-1a hash function
 * @param str - The string to hash
 * @returns The hash of the string
 */
export function fnv1a(str: string): bigint {
  let hash = 14695981039346656037n; // FNV offset basis for 64-bit
  const fnvPrime = 1099511628211n; // FNV prime for 64-bit

  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * fnvPrime) & 0xffffffffffffffffn; // Keep within 64 bits
  }
  return hash;
}
