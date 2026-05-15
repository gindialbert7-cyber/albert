/**
 * scripts/determinism-suite.ts
 *
 * The canonical render suite, factored out so determinism-ci.ts and
 * determinism-monkey-trap.ts can both run it. Imports the renderer
 * lazily so the monkey-trap can install global patches before any
 * lib/illustrator module loads.
 */

export type SuiteEntry = { name: string; render: () => string };

export async function buildSuite(): Promise<SuiteEntry[]> {
  const { renderPage, renderCharacterSheet } = await import('../lib/illustrator');
  type C = import('../lib/illustrator').Character;
  type P = import('../lib/illustrator').Page;

  const pip: C = {
    id: 'pip',
    name: 'Pip',
    species: 'rabbit',
    furColor: '#d8a06b',
    bellyColor: '#f4e3c2',
    noseColor: '#c97070',
    cheekColor: '#f5b6b0',
    eyeStyle: 'dot-shine',
    build: 'small-round',
    featureTilt: -6,
    scale: 1.0,
    accessory: { kind: 'scarf', color: '#5b7fb0' },
    seed: 4471,
  };

  const mossy: C = {
    id: 'mossy',
    name: 'Mossy',
    species: 'rabbit',
    furColor: '#a07153',
    bellyColor: '#e7c79a',
    noseColor: '#9b5a4a',
    cheekColor: '#e08a7e',
    eyeStyle: 'dot-shine',
    build: 'plump',
    featureTilt: 4,
    scale: 1.05,
    accessory: { kind: 'flower', color: '#e9788b' },
    seed: 9182,
  };

  const out: SuiteEntry[] = [];
  out.push({ name: 'sheet-pip', render: () => renderCharacterSheet(pip) });
  out.push({ name: 'sheet-mossy', render: () => renderCharacterSheet(mossy) });

  const BACKDROPS: P['backdrop'][] = [
    'meadow',
    'meadow-sunset',
    'night-sky',
    'forest-clearing',
    'burrow-interior',
    'pond',
    'snow-hills',
    'beach',
    'mountain-peak',
  ];
  const MOODS: P['mood'][] = ['day', 'sunset', 'night', 'morning', 'snow', 'forest'];

  let i = 0;
  for (const b of BACKDROPS) {
    for (const m of MOODS) {
      const idx = i++;
      const page: P = {
        id: `page-${b}-${m}`,
        backdrop: b,
        mood: m,
        seed: 12345 + idx * 7,
        background: [
          { kind: 'sun', x: 660, y: 110, r: 38, rays: true, z: 0 },
          { kind: 'moon', x: 200, y: 80, r: 30, z: 0 },
          { kind: 'cloud', x: 360, y: 70, w: 60, z: 1 },
          { kind: 'tree', x: 90, y: 470, h: 220, z: 2 },
          { kind: 'bird', x: 540, y: 130, scale: 1, z: 3 },
        ],
        characters: [
          {
            characterId: 'pip',
            pose: {
              facing: idx % 2 === 0 ? 'right' : 'left',
              arms: (['down', 'wave', 'reach-up', 'hold-front', 'hugging'] as const)[idx % 5],
              legs: (['stand', 'sit', 'walk'] as const)[idx % 3],
              eyes: (['open', 'closed', 'wide', 'wink-left', 'wink-right'] as const)[idx % 5],
              mouth: (['smile', 'small', 'open-o', 'frown'] as const)[idx % 4],
              headTilt: ((idx * 13) % 30) - 15,
            },
            placement: { x: 380, y: 540 },
          },
        ],
        foreground: [
          { kind: 'flower', x: 200, y: 560, scale: 1.0, color: '#e9788b' },
          { kind: 'mushroom', x: 600, y: 555, scale: 1.0, capColor: '#c84a5a', glow: true },
          { kind: 'butterfly', x: 460, y: 380, scale: 1.0 },
        ],
      };
      out.push({
        name: `page-${String(idx).padStart(2, '0')}-${b}-${m}`,
        render: () => renderPage(page, [pip, mossy]),
      });
    }
  }
  return out;
}
