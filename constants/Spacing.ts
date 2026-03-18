/**
 * Spacing & layout tokens.
 * 4-pt base grid, with named semantic aliases.
 */

export const Space = {
  px:   1,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  10:   40,
  12:   48,
  14:   56,
  16:   64,
  20:   80,
  24:   96,
};

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  book: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
};

// Tablet layout
export const Layout = {
  maxWidth:        900,
  readerMaxWidth:  760,
  tabletBreakpoint:768,
  columnGap:       Space[6],
  pagePaddingH:    Space[6],
  pagePaddingV:    Space[8],
  bookCardWidth:   140,
  bookCardWidthLg: 160,
  bookCardHeight:  210,
  bookCardHeightLg:240,
  coverAspect:     0.67, // width/height
};
