/**
 * ESLint Rule: API Export Restrictions
 *
 * Rules:
 * - api/ files should only re-export from facade/
 * - api/ should not expose core/ internals directly
 * - Ensures clean API boundary
 */

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that api/ only exports from facade/",
      category: "Architecture",
      recommended: true,
    },
    messages: {
      apiShouldExportFromFacade: "api/ should only export from facade/ or types/, not {{source}}",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only check files in api/ directory
    if (!filename.includes("/src/api/")) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        // Check export { foo } from "..."
        if (node.source) {
          const importPath = node.source.value;

          // Allow exports from facade/ and types/
          if (
            importPath.startsWith("~/facade/") ||
            importPath.startsWith("~/types/") ||
            importPath.startsWith("~/types")
          ) {
            return;
          }

          // Disallow exports from other layers
          if (importPath.startsWith("~/")) {
            context.report({
              node: node.source,
              messageId: "apiShouldExportFromFacade",
              data: {
                source: importPath,
              },
            });
          }
        }
      },
    };
  },
};
