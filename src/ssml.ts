/**
 * Escapes a plain-text string for safe embedding inside an SSML element.
 * Replaces the five XML special characters with their named entity references.
 *
 * @param text - The raw text to escape.
 * @returns The escaped string, safe to place inside an XML/SSML element.
 */
export function escapeSSML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
