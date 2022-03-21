/* eslint-disable curly */
import * as vscode from "vscode";
import * as espree from "espree";
const _HTML = require("html-parse-stringify");
const fs = require("fs");

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
  // 查找当前类的最后一行
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
export function handleSplitNameAndAttribute(resultText: string): {
  outputClassName: string;
  transOutputStyleObject: DeepObjectType;
} {
  const transJSONText = JSON.stringify(resultText)
    .trim()
    .split("\\n")
    .join("")
    .replace(/^"([^"]+)"$/, (match, p1) => p1)
    .split(" ")
    .join("");
  const styleObject: DeepObjectType = JSON.parse(
    `{${transJSONText
      .replaceAll(";", ",")
      .replaceAll("{", ":{")
      .replaceAll(/([\.])([\w\-]+)([\:])/g, (m, a, b, c) => `"${a}${b}"${c}`)
      .replaceAll(/([\{\,])([\w\-]+)([\:])/g, (m, a, b, c) => `${a}"${b}"${c}`)
      .replaceAll(/([\:])([\w\-\%]+)([\,])/g, (m, a, b, c) => `${a}"${b}"${c}`)
      .replaceAll(/(\")(\,)(\})/g, (m, a, b, c) => `${a}${c}`)}}`
  );
  return {
    outputClassName: Reflect.ownKeys(styleObject)[0] as string,
    transOutputStyleObject: styleObject,
  };
}
function getCheckFileDeep(tarPath: string, styPath: string) {
  const tarPathArr = tarPath.split("/");
  const styPathArr = styPath.split("/");
  let result = 0;
  tarPathArr.forEach((item, index) => {
    if (item === styPathArr[index]) {
      result = index;
    }
  });
  return result;
}
export function getStyleOfStylehubFile(
  document: vscode.TextDocument,
  styleFileLink: vscode.Uri[]
): DeepObjectType {
  const styleStore: DeepObjectType = {};
  let targetStylePath: number = 0;
  let targetLen: number = 0;
  styleFileLink.forEach((item, index) => {
    const fileLen = getCheckFileDeep(document.uri.path, item.fsPath);
    if (targetLen < fileLen) {
      targetLen = fileLen;
      targetStylePath = index;
    }
  });
  const res = fs.readFileSync(styleFileLink[targetStylePath].fsPath, "utf-8");
  const cssRes = res.split("\\n").join("");
  cssRes
    .split(".")
    .filter((item: any) => item)
    .forEach((item: string) => {
      const { outputClassName, transOutputStyleObject } =
        handleSplitNameAndAttribute(".".concat(item));
      const outputAttribute = transOutputStyleObject[outputClassName];
      const _name = Reflect.ownKeys(outputAttribute)[0] as string;
      const _value = outputAttribute[_name];
      styleStore[`u_${_name.trim()}`] = Reflect.has(
        styleStore,
        `u_${_name.trim()}`
      )
        ? {
            ...styleStore[`u_${_name.trim()}`],
            [`${_value.trim()}`]: outputClassName,
          }
        : { [`${_value.trim()}`]: outputClassName };
    });
  return styleStore;
}

export function createFix(
  document: vscode.TextDocument,
  textEditor: vscode.TextEditor,
  convertedCssStyle: ConvertedCssType,
  edit: vscode.WorkspaceEdit
): vscode.WorkspaceEdit {
  const targetMainClass = Reflect.ownKeys(convertedCssStyle)[0] as string;
  const targetMainAttribute = convertedCssStyle[targetMainClass];

  const find = false;
  const line = 0;

  // 假设一个目录只有一个嵌套 template
  let sl = 0,
    el = textEditor.visibleRanges[0].end.line;
  while (sl <= el) {
    const curLineText = document.lineAt(sl);
    if (curLineText.text.includes("<template")) {
      break;
    }
    sl++;
  }
  while (el >= sl) {
    const curLineText = document.lineAt(el);
    if (curLineText.text.includes("</template")) {
      break;
    }
    el--;
  }
  const templateRange = new vscode.Range(
    new vscode.Position(sl, 0),
    new vscode.Position(el + 1, 0)
  );
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

export function dfsConvertCSS(
  cssObjet: DFSObjectType,
  name: string,
  styleStore: DeepObjectType
): AnalyzedClassLabelType {
  const analyzedClassLabel: AnalyzedClassLabelType = {
    fixedClassName: name,
    notFixedCss: {},
    children: {},
  };
  const currentLayerCss = Reflect.ownKeys(cssObjet).filter(
    (item) => !item.toString().includes(".")
  ) as string[];
  const nextLayerCss = Reflect.ownKeys(cssObjet).filter((item) =>
    item.toString().includes(".")
  ) as string[];
  currentLayerCss.forEach((_item) => {
    if (typeof _item === "string") {
      const key = cssObjet[_item] as string;
      if (`u_${_item}` in styleStore && key in styleStore[`u_${_item}`]) {
        analyzedClassLabel.fixedClassName =
          analyzedClassLabel.fixedClassName.concat(
            styleStore[`u_${_item}`][key]
          );
      } else {
        analyzedClassLabel.notFixedCss[_item] = key;
      }
    }
  });
  nextLayerCss.forEach((_item) => {
    if (typeof _item !== "string") return;
    const key = cssObjet[_item] as DFSObjectType;
    analyzedClassLabel.children[_item] = dfsConvertCSS(key, _item, styleStore);
  });
  return analyzedClassLabel;
}

export function dfsFixedCSS(dfs: outputCss, name: string): string {
  let resultName = `${name} {`;
  Reflect.ownKeys(dfs.notFixedCss).forEach((_item) => {
    if (typeof _item !== "string") return;
    resultName = resultName.concat(`\n${_item}: ${dfs.notFixedCss[_item]};`);
  });
  Reflect.ownKeys(dfs.children).forEach((_item) => {
    if (typeof _item !== "string") return;
    const v = dfsFixedCSS(dfs.children[_item], _item);
    resultName = resultName.concat(`\n${v}`);
  });
  resultName = resultName.concat("\n}");
  return resultName;
}

function handleChangeHtmlAst(
  ast: AstType,
  currentStyleLayerAttribute: outputCss,
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
      astClassList[_index] = currentStyleLayerAttribute.fixedClassName
        .split(".")
        .join(" ");
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
