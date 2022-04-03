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

    const styleRes = await getBaseStyleConfig(entryPath, stylehubConfig);
    // 逻辑问题
    // if (styleRes === "error") return [];
    const { singleStyleTypeStore: commonStyleList, multiStyleTypeStore } =
      styleRes;
    const { classInStyleText, classInStyleRange } = getClassInStyle(
      document,
      range
    );

    // 转换本地样式
    const transferRes = await parseCurrentCSStoObject(classInStyleText);

    // 通过单原子样式表与当前样式作对比，生成转换后的样式
    const outputCSS = generateOutputCSSStyle(commonStyleList, transferRes);
    // 将转换后的样式转换为 vscode fixed 样式
    const editTemplate: TEditInterface = createHtmlFixedStyle(
      document,
      outputCSS,
      {
        classEdit: [],
        styleEdit: [],
      }
    );

    // 只转换 class

    const fixOnlyClass = handleFixedOnlyTransferClass(
      document,
      classInStyleRange,
      outputCSS,
      editTemplate
    );

    // 全量转换
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
