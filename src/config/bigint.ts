/**
 * Global BigInt JSON Serializer
 *
 * Converts:
 *   1n -> "1"
 *
 * So Express res.json() can safely serialize Prisma objects.
 */

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export {};