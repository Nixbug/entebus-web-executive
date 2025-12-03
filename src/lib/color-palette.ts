
//-- Color Palette for Avatars --
export const colorPalette = [
    '#E65858',
    '#7A58E6',
    '#F27E4B',
    '#589BE6',
    '#C158E6',
    '#4B9E7A',
    '#E67E22',
    '#3498DB',
    '#9B59B6',
    '#27AE60',
    '#E74C3C',
    '#1ABC9C',
    '#F1C40F',
    '#34495E',
    '#8E44AD',
    '#16A085',
    '#D35400',
    '#2980B9',
    '#27AE60',
    '#C0392B'
];

//-- Function to get color from string --
export function getColorFromName(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 10 + str.charCodeAt(i)) >>> 0;
    }
    return colorPalette[hash % colorPalette.length];
}