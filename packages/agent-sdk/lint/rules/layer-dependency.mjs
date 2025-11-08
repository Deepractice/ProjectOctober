/**
 * ESLint Rule: Enforce Layered Architecture Dependencies
 *
 * Architecture Rules:
 * - api/     → can import from: facade/, types/
 * - facade/  → can import from: core/, adapters/, persistence/, types/, utils/
 * - core/    → can import from: types/, utils/ (NO api/, NO facade/)
 * - types/   → pure types, no implementation imports
 * - adapters/→ can import from: types/, utils/
 * - persistence/ → can import from: types/, utils/
 *
 * Dependency Flow: api/ → facade/ → core/ → types/
 */

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce layered architecture import restrictions",
      category: "Architecture",
      recommended: true,
    },
    messages: {
      invalidImport: "{{from}} cannot import from {{to}}. Violates layered architecture.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Skip non-src files
    if (!filename.includes('/src/')) {
      return {};
    }

    // Extract layer from file path
    function getLayer(filePath) {
      const match = filePath.match(/\/src\/(api|facade|core|types|adapters|persistence|utils)\//);
      return match ? match[1] : null;
    }

    // Check if import is allowed
    function isAllowedImport(fromLayer, toLayer) {
      const rules = {
        api: ['facade', 'types'],
        facade: ['core', 'adapters', 'persistence', 'types', 'utils'],
        core: ['types', 'utils'],
        types: [], // No implementation imports
        adapters: ['types', 'utils'],
        persistence: ['types', 'utils'],
        utils: ['types'],
      };

      return rules[fromLayer]?.includes(toLayer) ?? true;
    }

    return {
      ImportDeclaration(node) {
        const fromLayer = getLayer(filename);
        if (!fromLayer) return;

        const importPath = node.source.value;

        // Only check internal imports (starting with ~/)
        if (!importPath.startsWith('~/')) return;

        const toLayer = getLayer(importPath);
        if (!toLayer) return;

        // Check if import is allowed
        if (!isAllowedImport(fromLayer, toLayer)) {
          context.report({
            node: node.source,
            messageId: "invalidImport",
            data: {
              from: fromLayer,
              to: toLayer,
            },
          });
        }
      },
    };
  },
};
