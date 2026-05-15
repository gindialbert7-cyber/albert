/**
 * Hand-drawn children's-book illustrator.
 *
 * The library is a "brush": deterministic, procedural, every line painted
 * by code. Characters are defined once as parameter sheets and re-rendered
 * identically on every page they appear on, which is how page-to-page
 * character consistency is achieved without any image model.
 *
 *   const story = newStory('pip-and-the-mushroom', 'Pip and the Glowing Mushroom');
 *   story = addCharacter(story, makeCharacter({ id: 'pip', name: 'Pip', species: 'rabbit', ... }));
 *   story = upsertPage(story, { id: 'page-1', backdrop: 'meadow', mood: 'morning', ... });
 *   const svg = renderPage(story.pages[0], story.cast);
 */

export * from './character';
export * from './palette';
export * from './page';
export * from './scenery';
export * from './story';
export { handStroke, hatchFill, handCircle, handRect, handBlob } from './drawing';
export { watercolorWash, lighten, darken } from './watercolor';
