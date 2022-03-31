/* eslint-disable curly */
import * as vscode from "vscode";
const _HTML = require("html-parse-stringify");
const fs = require("fs");

/**
 * Determine whether the current focus range is a class name,
 * and if the current editor focus has been determined, this will continue program
 * @param document vscode.TextDocument
 * @param range vscode.Range
 * @returns boolean
 */
export function isAtStartOfSmiley(
  document: vscode.TextDocument,
  range: vscode.Range
) {
  const start = range.start;
  const line = document.lineAt(start.line);
  const { text = "" } = line;
  var reg = /^\.[(\w)-]+\s\{$/;
  return reg.test(text.trim());
}

export function getClassInStyle(
  document: vscode.TextDocument,
  range: vscode.Range
): {
  classInStyleText: string;
  classInStyleRange: vscode.Range;
} {
  let findEndClass = false;
  let inwhileLoop = false;
  let classCountLoop: number = 0;
  let styleLineCount: number = range.start.line;
  while (!findEndClass) {
    if (classCountLoop === 0 && inwhileLoop) break;
    const { text: _text } = document.lineAt(styleLineCount);
    _text.includes("{") && classCountLoop++;
    _text.includes("}") && classCountLoop--;
    styleLineCount++;
    inwhileLoop = true;
  }
  let newRange: vscode.Range = new vscode.Range(
    range.start.translate(0, -range.start.character),
    range.end.translate(styleLineCount - range.end.line - 1, 0)
  );
  return {
    classInStyleText: document.getText(newRange),
    classInStyleRange: newRange,
  };
}

// export function createFix(
//   document: vscode.TextDocument,
//   convertedCssStyle: ConvertedCssStyleType,
//   edit: vscode.WorkspaceEdit
// ): vscode.WorkspaceEdit {
//   let sl = 0,
//     el = document.lineCount;
//   while (sl <= el) {
//     const curLineText = document.lineAt(sl);
//     if (curLineText.text.includes("<template")) {
//       break;
//     }
//     sl++;
//   }
//   while (el >= sl) {
//     const curLineText = document.lineAt(el - 1);
//     if (curLineText.text.includes("</template")) {
//       break;
//     }
//     el--;
//   }
//   const templateRange = new vscode.Range(
//     new vscode.Position(sl, 0),
//     new vscode.Position(el, 0)
//   );
//   const currentPageTemplace: string = document.getText(templateRange);
//   handleHTMLBuParse5(
//     edit,
//     { currentPageTemplace, convertedCssStyle },
//     document
//   );
//   return edit;
// }
