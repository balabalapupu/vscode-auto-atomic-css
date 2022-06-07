/* eslint-disable curly */
import * as vscode from "vscode";
const _HTML = require("html-parse-stringify");
const fs = require("fs");
const path = require("path");
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
  var reg = /^(\.|&)\S+\s\{$/;
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

export function isExist(
  entryPath: string,
  pathFolder: string,
  isStylehubLager: boolean
) {
  if (!isStylehubLager) {
    return entryPath === "" ? false : true;
  }
  const targetPath = path.join(
    pathFolder,
    "/node_modules/@datafe/stylehub/lib/stylehub.css"
  );
  if (fs.existsSync(targetPath)) {
    return true;
  }
  vscode.window.showWarningMessage(
    "你装 stylhub 了嘛，还是打开的文件夹不是项目的根路径"
  );
  return false;
}
