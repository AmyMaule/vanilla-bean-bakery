"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeSingleQuotes = void 0;
function escapeSingleQuotes(str) {
    if (str === void 0) { str = ""; }
    return str.replace(/'/g, "\\'");
}
exports.escapeSingleQuotes = escapeSingleQuotes;
//# sourceMappingURL=utils.js.map