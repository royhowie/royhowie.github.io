export function random(start: number, stopExclusive: number): number {
    return start + window.crypto.getRandomValues(new Uint8Array(1))[0] % (stopExclusive - start);
}