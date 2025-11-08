/**
 * Custom ESLint Rules for Agent SDK Architecture
 *
 * Enforces:
 * - Layered architecture dependencies
 * - File naming conventions
 * - API export restrictions
 */

import layerDependency from "./rules/layer-dependency.mjs";
import fileNaming from "./rules/file-naming.mjs";
import apiExports from "./rules/api-exports.mjs";

export default {
  rules: {
    "layer-dependency": layerDependency,
    "file-naming": fileNaming,
    "api-exports": apiExports,
  },
};
