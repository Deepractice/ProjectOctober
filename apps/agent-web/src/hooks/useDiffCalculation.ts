import { useMemo } from "react";

/**
 * Custom hook for calculating and caching diff between two strings
 *
 * This hook provides a memoized diff calculator with built-in caching
 * to improve performance when calculating the same diffs repeatedly.
 *
 * @returns {Function} createDiff - Function that takes (oldStr, newStr) and returns diff array
 *
 * @example
 * const createDiff = useDiffCalculation();
 * const diffLines = createDiff(oldContent, newContent);
 */
export const useDiffCalculation = () => {
  /**
   * Actual diff calculation function
   * Simple line-by-line diff algorithm
   *
   * @param {string} oldStr - Original string
   * @param {string} newStr - New string
   * @returns {Array} Array of diff objects with {type, content, lineNum}
   */
  const calculateDiff = (oldStr, newStr) => {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    // Simple diff algorithm - find common lines and differences
    const diffLines = [];
    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];

      if (oldIndex >= oldLines.length) {
        // Only new lines remaining
        diffLines.push({ type: "added", content: newLine, lineNum: newIndex + 1 });
        newIndex++;
      } else if (newIndex >= newLines.length) {
        // Only old lines remaining
        diffLines.push({ type: "removed", content: oldLine, lineNum: oldIndex + 1 });
        oldIndex++;
      } else if (oldLine === newLine) {
        // Lines are the same - skip in diff view (or show as context)
        oldIndex++;
        newIndex++;
      } else {
        // Lines are different
        diffLines.push({ type: "removed", content: oldLine, lineNum: oldIndex + 1 });
        diffLines.push({ type: "added", content: newLine, lineNum: newIndex + 1 });
        oldIndex++;
        newIndex++;
      }
    }

    return diffLines;
  };

  /**
   * Memoized diff calculator with LRU cache
   * Cache key is based on string lengths and first 50 chars
   * Max cache size is 100 entries
   */
  const createDiff = useMemo(() => {
    const cache = new Map();

    return (oldStr, newStr) => {
      const key = `${oldStr.length}-${newStr.length}-${oldStr.slice(0, 50)}`;

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = calculateDiff(oldStr, newStr);
      cache.set(key, result);

      // LRU cache eviction - keep max 100 entries
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return result;
    };
  }, []);

  return createDiff;
};
