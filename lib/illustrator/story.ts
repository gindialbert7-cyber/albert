/**
 * Story file format.
 *
 * A Story is a tiny JSON document that captures everything needed to
 * re-render an entire picture book deterministically: the cast (character
 * sheets) and the ordered list of pages (backdrop + placements). Storing
 * the cast inline is what guarantees character consistency: page renderers
 * always read the same parameter sheet for "pip" no matter when or where
 * the page is rendered.
 *
 * `updatedAt` is metadata only — it's never read by the renderer. The
 * callers (CLI, web app) supply it explicitly if they want to track when
 * the story was last edited; we do not auto-populate from Date.now to
 * keep this module clear of non-deterministic sources.
 */

import { Character } from './character';
import { Page } from './page';

export type Story = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cast: Character[];
  pages: Page[];
  /** Unix timestamp of last edit; informational, set by the caller. */
  updatedAt?: number;
};

export function newStory(id: string, title: string): Story {
  return {
    id,
    title,
    cast: [],
    pages: [],
  };
}

export function addCharacter(story: Story, character: Character): Story {
  const cast = story.cast.filter((c) => c.id !== character.id).concat(character);
  return { ...story, cast };
}

export function upsertPage(story: Story, page: Page): Story {
  const pages = story.pages.filter((p) => p.id !== page.id).concat(page);
  return { ...story, pages };
}

export function getCharacter(story: Story, id: string): Character | undefined {
  return story.cast.find((c) => c.id === id);
}
