/* eslint-disable curly */
import * as vscode from "vscode";
const fs = require("fs");
const path = require("path");
type StyleType = {
  [propName: string]: string;
};

import {
  isAtStartOfSmiley,
  getClassInStyle,
  handleSplitNameAndAttribute,
  getStyleOfStylehubFile,
  createFix,
  dfsConvertCSS,
  dfsFixedCSS,
} from "./utils/index";

const COMMAND = "auto-atomic-css.command";

let styleFileLink: vscode.Uri[];
let currentStyleStore: { [propName: string]: { [propName: string]: string } };
let textEditor: vscode.TextEditor;
export async function activate(context: vscode.ExtensionContext) {
  styleFileLink = await vscode.workspace.findFiles(
    "**/demoStyle.less",
    " /node_modules/ ",
    10
  );
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (!editor) {
        return;
      }
      textEditor = editor;
      const res = getStyleOfStylehubFile(editor.document, styleFileLink);
      currentStyleStore = res;
    },
    null,
    context.subscriptions
  );
  const actionsProvider = vscode.languages.registerCodeActionsProvider(
    "vue",
    new AutoAtomicCss(),
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );
  context.subscriptions.push(actionsProvider);
}

export function deactivate() {}

export class AutoAtomicCss implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] | undefined {
    if (
      !textEditor ||
      !currentStyleStore ||
      !isAtStartOfSmiley(document, range)
    )
      return;
    // 1. 获取需要修改的完整样式
    const { classInStyleText, classInStyleRange } = getClassInStyle(
      document,
      range
    );

    // 2. 拆分当前 class 的属性
    const { outputClassName, transOutputStyleObject } =
      handleSplitNameAndAttribute(classInStyleText);

    // 3. 拿到 stylehub 中存储的属性
    const styleStore = getStyleOfStylehubFile(document, styleFileLink);
    // 4. 通过 stylehub 转换当前 class 中的属性
    const convertedCssStyle: ConvertedCssStyleType = {};
    Reflect.ownKeys(transOutputStyleObject).forEach((item) => {
      if (typeof item !== "string") return;
      const v = dfsConvertCSS(transOutputStyleObject[item], item, styleStore);
      convertedCssStyle[item] = v;
    });

    let resultString = "";
    Reflect.ownKeys(convertedCssStyle).forEach((item) => {
      if (typeof item !== "string") return;
      const v = dfsFixedCSS(convertedCssStyle[item], item);
      resultString = resultString.concat(v);
    });
    // 5. 代码修复逻辑
    const _outputClassName = outputClassName.split(".")[1];
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, classInStyleRange, resultString);
    const replaceWithSFixedStyle: vscode.WorkspaceEdit = createFix(
      document,
      textEditor,
      convertedCssStyle,
      edit
    );
    const fix = new vscode.CodeAction(
      `可以原子化 ${outputClassName}`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = replaceWithSFixedStyle;
    return [fix];
  }
}
