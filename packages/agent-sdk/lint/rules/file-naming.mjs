/**
 * ESLint Rule: Enforce File Naming Conventions
 *
 * Rules:
 * - PascalCase: Files exporting a single class/interface (e.g., Agent.ts, BaseSession.ts)
 * - camelCase: Files exporting multiple utilities or types (e.g., helpers.ts, protocol.ts)
 * - Special cases: index.ts, types.ts
 *
 * How to determine:
 * - If file exports ONE main class → PascalCase
 * - If file exports multiple items → camelCase
 */

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce consistent file naming conventions",
      category: "Style",
      recommended: true,
    },
    messages: {
      shouldBePascalCase: "File '{{filename}}' exports a single class '{{className}}' and should use PascalCase ({{expected}}.ts)",
      shouldBeCamelCase: "File '{{filename}}' exports multiple items and should use camelCase",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Skip non-src files and test files
    if (!filename.includes('/src/') || filename.includes('.test.')) {
      return {};
    }

    // Skip special files
    const basename = filename.split('/').pop().replace(/\.(ts|tsx|js|jsx)$/, '');
    if (['index', 'types'].includes(basename)) {
      return {};
    }

    let exportedClasses = [];
    let totalExports = 0;

    return {
      ExportNamedDeclaration(node) {
        totalExports++;

        // Check if it's a class declaration
        if (node.declaration?.type === 'ClassDeclaration') {
          exportedClasses.push(node.declaration.id.name);
        }
      },

      ExportDefaultDeclaration() {
        totalExports++;
      },

      'Program:exit'() {
        // If exactly one class is exported
        if (exportedClasses.length === 1 && totalExports === 1) {
          const className = exportedClasses[0];

          // Check if filename is PascalCase
          const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(basename);

          if (!isPascalCase) {
            context.report({
              loc: { line: 1, column: 0 },
              messageId: "shouldBePascalCase",
              data: {
                filename: basename,
                className,
                expected: className,
              },
            });
          }
        }

        // If multiple exports (TODO: could add camelCase check)
        // This is less strict as facade files often use camelCase
      },
    };
  },
};
