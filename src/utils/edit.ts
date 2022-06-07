import * as vscode from "vscode";

export function handleFixedOnlyTransferClass(
  document: vscode.TextDocument,
  classInStyleRange: vscode.Range,
  outputCSS: GenerateOutputCssStyleType,
  editTemplate: TEditInterface
): vscode.CodeAction {
  const transferedCSS = handleTransferAllCSS(outputCSS);
  const onlyFixedClassEdit = new vscode.WorkspaceEdit();
  editTemplate.classEdit.map((item) => {
    const range = item.range as vscode.Range;
    onlyFixedClassEdit.replace(document.uri, range, item.text);
  });
  onlyFixedClassEdit.replace(document.uri, classInStyleRange, transferedCSS);
  const fixOnlyClass = new vscode.CodeAction(
    `convert to atomic class`,
    vscode.CodeActionKind.QuickFix
  );
  fixOnlyClass.edit = onlyFixedClassEdit;
  return fixOnlyClass;
}

export function handleTransferAll(
  document: vscode.TextDocument,
  classInStyleRange: vscode.Range,
  editTemplate: TEditInterface
): vscode.CodeAction {
  const fixedClassandStyleEdit = new vscode.WorkspaceEdit();
  editTemplate.classEdit.map((item) => {
    const range = item.range as vscode.Range;
    fixedClassandStyleEdit.replace(document.uri, range, item.text);
  });
  editTemplate.styleEdit.map((item) => {
    const range = item.range as vscode.Range;
    fixedClassandStyleEdit.replace(document.uri, range, item.text);
  });
  fixedClassandStyleEdit.replace(document.uri, classInStyleRange, "");
  const fixed = new vscode.CodeAction(
    `convert all atomic class and style`,
    vscode.CodeActionKind.QuickFix
  );
  fixed.edit = fixedClassandStyleEdit;
  return fixed;
}

function handleTransferAllCSS(outputCSS: GenerateOutputCssStyleType) {
  const resultCSS: IStyleOutputInterface = handleConvertCSStoObject(outputCSS);
  const mainClass = Object.keys(resultCSS)[0];
  const mainClassValue = resultCSS[mainClass] as IStyleType;
  let result = "";
  Object.keys(resultCSS).forEach((item, index) => {
    const itemClassValue = resultCSS[item] as IStyleType;
    const itemResult = handleGenerateCSSObjecttoString(item, itemClassValue);
    result += `${itemResult}\n`;
  });
  return result;
}

function handleGenerateCSSObjecttoString(
  mainClass: string,
  resultCSS: IStyleOutputInterface | IStyleType
): string {
  const resultCSSString: string[] = [];
  Object.keys(resultCSS).forEach((item) => {
    if (typeof resultCSS[item] !== "string") {
      const currentValue = resultCSS[item] as IStyleType;
      const res = handleGenerateCSSObjecttoString(item, currentValue);
      resultCSSString.push(res);
    } else {
      resultCSSString.push(`${item}:${resultCSS[item]};\n`);
    }
  });
  return `.${mainClass} {\n${resultCSSString.join("")}}\n`;
}

function handleConvertCSStoObject(
  outputCSS: GenerateOutputCssStyleType
): IStyleOutputInterface {
  const resultCSS: IStyleOutputInterface = {};
  [...outputCSS.entries()].forEach((item) => {
    const _class: string[] = item[0].reverse();
    const _style: IStyleType = item[1].notFixedCSSList;
    let currentOutputCSSLayer = resultCSS;
    _class.forEach((_classItem, index) => {
      if (index === _class.length - 1) {
        currentOutputCSSLayer[_classItem] = _style;
      } else {
        if (!currentOutputCSSLayer[_classItem]) {
          currentOutputCSSLayer[_classItem] = {};
        }
        currentOutputCSSLayer = currentOutputCSSLayer[
          _classItem
        ] as IStyleOutputInterface;
      }
    });
  });
  return resultCSS;
}
