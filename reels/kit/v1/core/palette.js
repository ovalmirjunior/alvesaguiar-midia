// Colours (areas/work/content/brand-guide.md "Standard palette"). Array index = tone, 1 darkest to 5 lightest.
export const NOITE = '#0A0C10', LIGHT = '#F2F4F7', CLARO = '#F2F4F7', TINTA = '#0F1722', MUTEDL = '#5B6472', MUTED_ON_DARK = '#8B93A1', SUPERFICIE = '#161B22', MARINHO = '#1F3F6E';
export const AMBAR = ['', '#1E1206', '#5C3A0E', '#9A6110', '#F2C14E', '#FFF0C9'];
export const TIJOLO = ['', '#24100A', '#6E2A14', '#B4532A', '#F08A5D', '#FDE3D4'];
export const VERDE = ['', '#0A1F14', '#12452A', '#1E7A46', '#7FD3A0', '#DDF5E7'];
export const ACO = ['', '#0B1424', '#1F3F6E', '#2D5A9A', '#9DB4D6', '#E3ECF7'];
export const RAMP = { ambar: AMBAR, tijolo: TIJOLO, verde: VERDE, aco: ACO };
export const ramp = name => { const r = RAMP[name]; if (!r) throw new Error('unknown ramp: ' + name); return r };
export const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')' };
