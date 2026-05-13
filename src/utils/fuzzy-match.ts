/**
 * Normalizes a string for fuzzy filename matching:
 * lowercase, strip non-alphanumeric, collapse whitespace.
 */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts the art name from an image filename by stripping the extension
 * and common suffixes like _front, _back, -1, etc.
 */
export function artNameFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')          // strip extension
    .replace(/[-_](front|back|main|\d+)$/i, '') // strip common suffixes
    .replace(/[-_]/g, ' ')            // underscores/hyphens → spaces
    .trim();
}

/**
 * Given a list of art names and an image file, returns the best-matching
 * art name id (row id) or null if no reasonable match is found.
 */
export function matchImageToArtName(
  filename: string,
  artNames: { id: string; artName: string }[]
): string | null {
  const normalizedFile = normalize(artNameFromFilename(filename));

  let bestId: string | null = null;
  let bestScore = 0;

  for (const { id, artName } of artNames) {
    const normalizedArt = normalize(artName);

    // Exact match
    if (normalizedFile === normalizedArt) return id;

    // Containment match — score by overlap length
    if (normalizedArt.includes(normalizedFile) || normalizedFile.includes(normalizedArt)) {
      const score = Math.min(normalizedFile.length, normalizedArt.length);
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }
  }

  return bestScore >= 3 ? bestId : null;
}
