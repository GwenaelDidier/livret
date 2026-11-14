const THEME_ILLUSTRATIONS: Record<string, string> = {
    'D1-T1': 'd1-t1-speech-bubble.svg',
    'D1-T2': 'd1-t2-speech-balloon.svg',
    'D1-T3': 'd1-t3-ear.svg',
    'D1-T4': 'd1-t4-books.svg',
    'D1-T5': 'd1-t5-open-book.svg',
    'D1-T6': 'd1-t6-input-symbols.svg',
    'D1-T7': 'd1-t7-writing-hand.svg',
    'D1-T8': 'd1-t8-pencil.svg',
    'D2-T1': 'd2-t1-input-numbers.svg',
    'D2-T2': 'd2-t2-first-place-medal.svg',
    'D2-T3': 'd2-t3-puzzle-piece.svg',
    'D2-T4': 'd2-t4-large-blue-diamond.svg',
    'D2-T5': 'd2-t5-straight-ruler.svg',
    'D2-T6': 'd2-t6-repeat-button.svg',
    'D3-T1': 'd3-t1-person-running.svg',
    'D3-T2': 'd3-t2-person-cartwheeling.svg',
    'D3-T3': 'd3-t3-dancer.svg',
    'D3-T4': 'd3-t4-handshake.svg',
    'D4-T1': 'd4-t1-artist-palette.svg',
    'D4-T2': 'd4-t2-crayon.svg',
    'D4-T3': 'd4-t3-microphone.svg',
    'D4-T4': 'd4-t4-drum.svg',
    'D4-T5': 'd4-t5-headphones.svg',
    'D4-T6': 'd4-t6-performing-arts.svg',
    'D5-T1': 'd5-t1-calendar.svg',
    'D5-T2': 'd5-t2-hourglass.svg',
    'D5-T3': 'd5-t3-world-map.svg',
    'D5-T4': 'd5-t4-school.svg',
    'D6-T1': 'd6-t1-seedling.svg',
    'D6-T2': 'd6-t2-droplet.svg',
    'D6-T3': 'd6-t3-gear.svg',
};

export function getCompetenceIllustration(sourceId: string | null | undefined, code: string): string | null {
    const themeId = sourceId?.split(':')[1] ?? code.match(/^(D[1-6]-T\d+)/)?.[1];
    const filename = themeId ? THEME_ILLUSTRATIONS[themeId] : undefined;
    if (!themeId || !filename) return null;
    return `/assets/illustrations/${themeId.slice(0, 2)}/${filename}`;
}
