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

export function createFix(
  document: vscode.TextDocument,
  convertedCssStyle: ConvertedCssStyleType,
  edit: vscode.WorkspaceEdit
): vscode.WorkspaceEdit {
  const targetMainClass = Reflect.ownKeys(convertedCssStyle)[0] as string;
  const targetMainAttribute = convertedCssStyle[targetMainClass];

  const find = false;
  const line = 0;
  let sl = 0,
    el = document.lineCount;
  while (sl <= el) {
    const curLineText = document.lineAt(sl);
    if (curLineText.text.includes("<template")) {
      break;
    }
    sl++;
  }
  while (el >= sl) {
    const curLineText = document.lineAt(el - 1);
    if (curLineText.text.includes("</template")) {
      break;
    }
    el--;
  }
  const templateRange = new vscode.Range(
    new vscode.Position(sl, 0),
    new vscode.Position(el, 0)
  );
  console.log(templateRange, "------");
  const currentPageTemplace = document.getText(templateRange);
  const htmlToAst: AstType[] = _HTML.parse(currentPageTemplace);
  htmlToAst.forEach((item: AstType, index: number) => {
    if (item.type !== "tag") return;
    handleChangeHtmlAst(htmlToAst[index], targetMainAttribute, targetMainClass);
  });
  const astToString = _HTML.stringify(htmlToAst);
  edit.replace(document.uri, templateRange, astToString);
  return edit;
}

function handleChangeHtmlAst(
  ast: AstType,
  currentStyleLayerAttribute: TransferCSSDataByCommonCssConfigType,
  cssName: string
) {
  if (ast.children) {
    ast.children.forEach((item, index) => {
      if (item.type !== "tag") return;
      handleChangeHtmlAst(
        ast.children[index],
        currentStyleLayerAttribute,
        cssName
      );
    });
  }
  if (ast.attrs && ast.attrs.class) {
    const astClassList = ast.attrs.class.split(" ");
    const _cssName = cssName.split(".")[1];
    const _index = astClassList.indexOf(_cssName);
    if (_index > -1) {
      astClassList[_index] =
        currentStyleLayerAttribute.fixedClassName.join(" ");
      ast.attrs.class = astClassList.join(" ");
      Reflect.ownKeys(currentStyleLayerAttribute.children).forEach((item) => {
        if (typeof item !== "string") return;
        ast.children &&
          ast.children.forEach((_item, index: number) => {
            if (_item.type !== "tag") return;
            handleChangeHtmlAst(
              ast.children[index],
              currentStyleLayerAttribute.children[item],
              item
            );
          });
      });
    }
  }
}
