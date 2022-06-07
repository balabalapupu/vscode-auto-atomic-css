/* eslint-disable curly */
import * as vscode from "vscode";
import { getBaseStyleConfig } from "./utils/common-style";
const path = require("path");
import {
  parseCurrentCSStoObject,
  generateOutputCSSStyle,
} from "./utils/css-ast-func";
import { isAtStartOfSmiley, getClassInStyle, isExist } from "./utils/index";
import { createHtmlFixedStyle } from "./utils/html-ast-func";
import { handleFixedOnlyTransferClass, handleTransferAll } from "./utils/edit";

let entryPath = "";
let stylhubBasePath = "";
let isStylehubLager = false;
type StyleConfigType = {
  singleStyleTypeStore: IObjectStyleType;
  multiStyleTypeStore: MultiStyleTypeStoreType;
};
export function deactivate() {}

export class AutoAtomicCss implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];
  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): Promise<vscode.CodeAction[]> {
    let fix: vscode.CodeAction;
    const isExistStylehubConfig = isExist(
      entryPath,
      stylhubBasePath,
      isStylehubLager
    );
    if (!isAtStartOfSmiley(document, range) || !isExistStylehubConfig) {
      return [];
    }
    let stylehubConfig = "";
    if (stylhubBasePath) {
      stylehubConfig = path.join(
        stylhubBasePath,
        "/node_modules/@datafe/stylehub/lib/stylehub.css"
      );
    }

    // 1. 获取基础样式
    const styleRes: {
      singleStyleTypeStore: IObjectStyleType;
      multiStyleTypeStore: MultiStyleTypeStoreType;
    } = await getBaseStyleConfig(entryPath, stylehubConfig);
    const { singleStyleTypeStore: commonStyleList, multiStyleTypeStore } =
      styleRes;

    // 2. 获取当前样式
    let { classInStyleText, classInStyleRange } = getClassInStyle(
      document,
      range
    );

    let _classInStyleText = classInStyleText;
    let targetClassLine = 1;
    let currentCount = 0;
    let targetClassText = "";
    if (classInStyleText.trim().startsWith("&")) {
      for (let i = classInStyleRange.start.line - 1; i > 0; i--) {
        const line = document.lineAt(i);
        const { text = "" } = line;
        const checkTargetLine: string[] = text
          .split("")
          .filter((item) => item === "{" || item === "}");
        if (checkTargetLine.length) {
          for (let i = checkTargetLine.length - 1; i >= 0; i--) {
            if (checkTargetLine[i] === "}") {
              currentCount--;
            } else {
              currentCount++;
            }
          }
        }
        if (currentCount === targetClassLine) {
          if (/^&[(\w)-]+\s\{$/.test(text.trim())) {
            const _target = /^&(\S+)/.exec(text.trim()) as RegExpExecArray;
            console.log(_target, "---_target---");
            targetClassText = _target[1] + targetClassText;
            console.log(targetClassText, "------");
            targetClassLine++;
          } else {
            const _target = /^\.(\S+)/.exec(text.trim()) as RegExpExecArray;
            console.log(_target, "---_target---2");
            if (_target && _target.length) {
              targetClassText = _target[1] + targetClassText;
              console.log(targetClassText, "------");
              break;
            }
          }
        }
        if (text.includes("<style")) {
          break;
        }
      }
      _classInStyleText = _classInStyleText
        .trim()
        .replace(/^(&)*/, `.${targetClassText}`);
    }

    // 3. 转换本地样式
    const transferRes: Map<string[], IStyleType> =
      await parseCurrentCSStoObject(_classInStyleText);

    // 4. 通过单原子样式表与当前样式作对比，生成转换后的样式
    const outputCSS: GenerateOutputCssStyleType = generateOutputCSSStyle(
      commonStyleList,
      transferRes
    );

    // 5. 将转换后的样式转换为 vscode fixed 样式
    const editTemplate: TEditInterface = createHtmlFixedStyle(
      document,
      outputCSS,
      {
        classEdit: [],
        styleEdit: [],
      }
    );

    // if 只转换 class 不转换不存在与原子样式表的 class
    const fixOnlyClass: vscode.CodeAction = handleFixedOnlyTransferClass(
      document,
      classInStyleRange,
      outputCSS,
      editTemplate
    );

    // else 全量转换
    const fixed = handleTransferAll(document, classInStyleRange, editTemplate);

    return [fixOnlyClass, fixed];
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const actionsProvider = vscode.languages.registerCodeActionsProvider(
    "vue",
    new AutoAtomicCss(),
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );
  const disposable = vscode.commands.registerCommand(
    "vue-auto-atomic-css",
    () => {
      // 先检测 stylehub 配置
      vscode.window
        .showQuickPick(["使用 stylehub & @datafe/stylehub >= 0.1.3", "其他"], {
          canPickMany: false,
          ignoreFocusOut: true,
          matchOnDescription: true,
          matchOnDetail: true,
          placeHolder: "使用 stylehub & @datafe/stylehub >= 0.1.3",
          title: "请选择原子化样式表类型",
        })
        .then(function (msg) {
          // > 0.1.3 则判断是否引入自定义样式
          if (msg === "使用 stylehub & @datafe/stylehub >= 0.1.3") {
            vscode.window
              .showQuickPick(["是", "否"], {
                canPickMany: false,
                ignoreFocusOut: true,
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "是",
                title: "是否还需要引入自定义样式表",
              })
              .then(function (msg) {
                if (msg === "是") {
                  let workspaceFolders =
                    vscode.workspace?.workspaceFolders?.map(
                      (item) => item.uri.path
                    ) as string[];
                  if (workspaceFolders.length !== 1) {
                    vscode.window.showInformationMessage(
                      "请检查工作区配置，只支持单独工作区"
                    );
                    return;
                  }
                  stylhubBasePath = workspaceFolders[0];
                  vscode.window
                    .showOpenDialog({
                      // 可选对象
                      canSelectFiles: true, // 是否可选文件
                      canSelectFolders: false, // 是否可选文件夹
                      canSelectMany: false, // 是否可以选择多个
                      defaultUri: vscode.Uri.file("/D:/"), // 默认打开本地路径
                      openLabel: "选择原子化样式表入口文件",
                    })
                    .then((msg) => {
                      if (!msg) {
                        vscode.window.showInformationMessage(
                          "配置成功啦，赶紧开始吧"
                        );
                        context.subscriptions.push(actionsProvider);
                        return;
                      }
                      entryPath = msg[0].path;
                      context.subscriptions.push(actionsProvider);
                      vscode.window.showInformationMessage(
                        "配置成功啦，赶紧开始吧"
                      );
                    });
                }
              });
          } else {
            isStylehubLager = false;
            vscode.window
              .showOpenDialog({
                // 可选对象
                canSelectFiles: true, // 是否可选文件
                canSelectFolders: false, // 是否可选文件夹
                canSelectMany: false, // 是否可以选择多个
                defaultUri: vscode.Uri.file("/D:/"), // 默认打开本地路径
                openLabel: "选择原子化样式表入口文件",
              })
              .then((msg) => {
                if (!msg) {
                  vscode.window.showWarningMessage("啥也不配置上哪给你自动化");
                  return;
                }
                entryPath = msg[0].path;
                context.subscriptions.push(actionsProvider);
                vscode.window.showInformationMessage("配置成功啦，赶紧开始吧");
              });
          }
        });
    }
  );
  context.subscriptions.push(disposable);
}
