export function random(start: number, stopExclusive: number): number {
    return start + (window.crypto.getRandomValues(new Uint32Array(1))[0] % (stopExclusive - start));
}