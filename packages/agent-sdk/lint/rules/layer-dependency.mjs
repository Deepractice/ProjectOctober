/**
 * ESLint Rule: Enforce Layered Architecture Dependencies
 *
 * Architecture Rules:
 * - api/     → can import from: facade/, types/, errors/
 * - facade/  → can import from: core/, adapters/, persistence/, types/, errors/, utils/
 * - core/    → can import from: types/, errors/, utils/ (NO api/, NO facade/)
 * - errors/  → pure error definitions, minimal imports
 * - types/   → pure types, no implementation imports
 * - adapters/→ can import from: types/, errors/, utils/
 * - persistence/ → can import from: types/, errors/, utils/
 *
 * Dependency Flow: api/ → facade/ → core/ → types/
 *                                        → errors/
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
    if (!filename.includes("/src/")) {
      return {};
    }

    // Extract layer from file path
    function getLayer(filePath) {
      const match = filePath.match(
        /\/src\/(api|facade|core|errors|types|adapters|persistence|utils)\//
      );
      return match ? match[1] : null;
    }

    // Check if import is allowed
    function isAllowedImport(fromLayer, toLayer) {
      const rules = {
        api: ["facade", "types", "errors"],
        facade: ["core", "adapters", "persistence", "types", "errors", "utils"],
        core: ["types", "errors", "utils"],
        errors: [], // Pure error definitions, minimal imports
        types: [], // No implementation imports
        adapters: ["types", "errors", "utils"],
        persistence: ["types", "errors", "utils"],
        utils: ["types"],
      };

      return rules[fromLayer]?.includes(toLayer) ?? true;
    }

    return {
      ImportDeclaration(node) {
        const fromLayer = getLayer(filename);
        if (!fromLayer) return;

        const importPath = node.source.value;

        // Only check internal imports (starting with ~/)
        if (!importPath.startsWith("~/")) return;

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
