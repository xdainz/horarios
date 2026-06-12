// case- and accent-insensitive comparisons
export function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}
