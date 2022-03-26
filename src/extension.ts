/* eslint-disable curly */
const fs = require("fs");
const path = require("path");
import * as vscode from "vscode";
import getCommonStyle from "./utils/common-style";
import {
  parseCurrentCSS,
  translateCurrentCSS,
  generateCurrentCSS,
} from "./utils/css-ast-func";
import { isAtStartOfSmiley, getClassInStyle, createFix } from "./utils/index";

let entryPath = "";

export async function activate(context: vscode.ExtensionContext) {
  const actionsProvider = vscode.languages.registerCodeActionsProvider(
    "vue",
    new AutoAtomicCss(),
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );
  const disposable = vscode.commands.registerCommand(
    "auto-atomic-doing",
    () => {
      // Display a message box to the user
      vscode.window.showInformationMessage("auto-atomic-css start!");
      vscode.window
        .showOpenDialog({
          // 可选对象
          canSelectFiles: true, // 是否可选文件
          canSelectFolders: false, // 是否可选文件夹
          canSelectMany: true, // 是否可以选择多个
          defaultUri: vscode.Uri.file("/D:/"), // 默认打开本地路径
          openLabel: "set the address of common atomic entry",
        })
        .then((msg) => {
          if (!msg) return;
          entryPath = msg[0].path;
          context.subscriptions.push(actionsProvider);
        });
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}

export class AutoAtomicCss implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];
  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): Promise<vscode.CodeAction[] | undefined> {
    if (!isAtStartOfSmiley(document, range)) return;
    const commonStyleList = await getCommonStyle(entryPath);

    const { classInStyleText, classInStyleRange } = getClassInStyle(
      document,
      range
    );

    const { outputClassName, transOutputStyleObject } = await parseCurrentCSS({
      resultText: classInStyleText,
    });

    const convertedCssStyle: ConvertedCssStyleType = {};
    Reflect.ownKeys(transOutputStyleObject).forEach((item) => {
      if (typeof item !== "string") return;
      const transferedData = translateCurrentCSS({
        name: item,
        config: transOutputStyleObject[item],
        commonStyleList,
      });
      convertedCssStyle[item] = transferedData;
    });
    let generatorString = "";
    Reflect.ownKeys(convertedCssStyle).forEach((item) => {
      if (typeof item !== "string") return;
      const v = generateCurrentCSS({
        currentLayer: convertedCssStyle[item],
        name: item,
      });
      generatorString = generatorString.concat(v);
    });
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, classInStyleRange, generatorString);
    const replaceWithSFixedStyle: vscode.WorkspaceEdit = createFix(
      document,
      convertedCssStyle,
      edit
    );
    const fix = new vscode.CodeAction(
      `the class ${outputClassName} can convert to atomic css`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = replaceWithSFixedStyle;
    return [fix];
  }
}
