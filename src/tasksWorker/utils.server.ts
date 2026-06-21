/**
 * Computes intersection between array a and b, i.e. keep elements that are in a and b.
 *
 * @param a Array a
 * @param b Array b
 */
export function arrayIntersect<T>(a: T[], b: T[]): T[] {
	const setB = new Set(b);
	return a.filter((x) => setB.has(x));
}

/**
 * Computes array difference between a and b, i.e. keep elements that are in a and not in b.
 *
 * @param a Array a
 * @param b Array b
 */
export function arrayDifference<T>(a: T[], b: T[]): T[] {
	const setB = new Set(b);
	return a.filter((x) => !setB.has(x));
}
