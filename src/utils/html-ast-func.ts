/* eslint-disable curly */
import * as vscode from "vscode";
import {
  ChildNode,
  Document,
  DocumentFragment,
  Element,
  ElementLocation,
  Location,
  parse,
} from "parse5";

type TransferHTMLTextType = DocumentFragment | ChildNode;

export function createHtmlFixedStyle(
  htmlEdit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  outputCSS: GenerateOutPutCSSStyle,
  mainClassName: string
) {
  const currentPageTemplace: string = handleFindScoreOfTemplate(document);
  const text: Document = htmlParseOption(currentPageTemplace);
  const transferHtmlText: DocumentFragment | undefined = htmlTransterOption(
    text.childNodes[0]
  );
  if (!transferHtmlText) return htmlEdit;
  htmlGenerateOption(
    document,
    transferHtmlText,
    {
      [mainClassName]: outputCSS,
    },
    htmlEdit
  );

  return htmlEdit;
}

function handleFindScoreOfTemplate(document: vscode.TextDocument): string {
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
  return document.getText(templateRange);
}

function htmlParseOption(currentPageTemplace: string) {
  return parse(currentPageTemplace, {
    sourceCodeLocationInfo: true,
  });
}

function htmlTransterOption(text: any): DocumentFragment | undefined {
  let loop = [text];
  let current: DocumentFragment | undefined = undefined;
  while (loop.length > 0) {
    const currentNode = loop.pop();
    if (
      currentNode.nodeName === "template" &&
      currentNode.content &&
      currentNode.content.nodeName === "#document-fragment"
    ) {
      current = currentNode.content;
      break;
    }
    currentNode.childNodes &&
      currentNode.childNodes.forEach((item: any) => {
        loop.push(item);
      });
  }
  return current;
}
/**
 * warning！ 递归类，这个函数有问题，需要把递归类转换成 [father-class, current-class] 格式再遍历
 * @param document
 * @param transferHtmlText
 * @param currentCSSlayer
 * @param htmlEdit
 * @returns
 */
function htmlGenerateOption<
  V extends vscode.TextDocument,
  T extends TransferHTMLTextType,
  U extends GenerateHtmlInterface,
  P extends vscode.WorkspaceEdit
>(document: V, transferHtmlText: T, currentCSSlayer: U, htmlEdit: P): void {
  if (transferHtmlText.nodeName === "#text") return;

  console.log(transferHtmlText, "------", currentCSSlayer);

  // 先确定 attrs 中有没有 class 属性，如果有在具体判断
  // warning！ 就是这个位置去遍历 css 选择器，待做并需要拆分
  if ("attrs" in transferHtmlText) {
    const currentNodeClass = transferHtmlText.attrs.find(
      (item: any) => item.name === "class"
    );
    if (currentNodeClass) {
      const currentNodeClassList = currentNodeClass.value.split(" ");
      const outputClassList = Object.keys(currentCSSlayer).filter(
        (item) => item.split(".").length > 1
      );
      outputClassList.forEach((item) => {
        const _item = item.split(".")[1];
        // 根据类名判断
        if (currentNodeClassList.includes(_item)) {
          const currentStyleLayerAttribute = currentCSSlayer[item];
          // 找到需要修改的类了，进行修改 class 属性和 style 属性
          handleClassandStyleOption(
            document,
            transferHtmlText,
            currentStyleLayerAttribute,
            currentNodeClassList,
            htmlEdit
          );

          // 改完更改需要递归的类，继续递归下去
          const nextCSSlayer = currentStyleLayerAttribute.children;
          handleLoopChildNodes(
            document,
            transferHtmlText,
            nextCSSlayer,
            htmlEdit
          );
        }
      });
    }
  }
  handleLoopChildNodes(document, transferHtmlText, currentCSSlayer, htmlEdit);
}

/**
 *  warning！ 处理当前 tag 的 class 和 style 需要拆分成允许插槽插入的格式
 * @param document
 * @param transferHtmlText
 * @param currentStyleLayerAttribute
 * @param currentNodeClassList
 * @param htmlEdit
 */
function handleClassandStyleOption<
  V extends vscode.TextDocument,
  T extends Element,
  U extends GenerateOutPutCSSStyle,
  P extends vscode.WorkspaceEdit
>(
  document: V, // 当前文档
  transferHtmlText: T, // parse5 解析出来的节点
  currentStyleLayerAttribute: U, // 需要修改的转换后的 css 格式
  currentNodeClassList: string[], // 原始 class 列表
  htmlEdit: P
) {
  // 1. 修改 class 属性
  if (currentStyleLayerAttribute.fixedClassName.length > 0) {
    const classScope = transferHtmlText.sourceCodeLocation?.attrs?.class;
    // 输出当前 字符串 和 范围
    const { classString, classRange } = handleFindScoreFromOffset(
      document,
      classScope,
      transferHtmlText
    );
    const set = new Set([
      ...currentNodeClassList,
      ...currentStyleLayerAttribute.fixedClassName,
    ]);
    const newClassList = Array.from(set);
    const newClass = `class="${newClassList.join(" ")}"`;
    htmlEdit.replace(document.uri, classRange, newClass);
  }

  // 2. 修改 style 属性
  if (Object.keys(currentStyleLayerAttribute.notFixedCSS).length > 0) {
    const styleScope = transferHtmlText.sourceCodeLocation?.attrs?.style;
    // 输出当前 字符串 和 范围
    const { classString: styleString, classRange: styleRange } =
      handleFindScoreFromOffset(document, styleScope, transferHtmlText);
    const originStyle = transferHtmlText.attrs.find(
      (item) => item.name === "style"
    );
    let originStyleList = originStyle ? originStyle.value.split(";") : [];
    originStyleList.map((item) => item.trim());
    const notFixedStyleList = Object.keys(
      currentStyleLayerAttribute.notFixedCSS
    ).map((item) => {
      const value = currentStyleLayerAttribute.notFixedCSS[item];
      return `${item}: ${value}`;
    });
    const set = new Set([...originStyleList, ...notFixedStyleList]);
    const newStyleList = Array.from(set);
    const newStyle =
      styleString === ""
        ? ` style="${newStyleList.join(";")}" `
        : `style="${newStyleList.join(";")}"`;
    htmlEdit.replace(document.uri, styleRange, newStyle);
  }
}

function handleFindScoreFromOffset(
  document: vscode.TextDocument,
  classScope: Location | undefined,
  transferHtmlText: Element
): {
  classString: string;
  classRange: vscode.Range;
} {
  if (!classScope) {
    const _source = transferHtmlText.sourceCodeLocation as ElementLocation;
    const _nodeName = transferHtmlText.nodeName;
    const classRange = new vscode.Range(
      new vscode.Position(
        _source.startLine - 1,
        _source.startCol + _nodeName.length
      ),
      new vscode.Position(
        _source.startLine - 1,
        _source.startCol + _nodeName.length + 1
      )
    );
    return {
      classString: "",
      classRange,
    };
  }
  const classRange = new vscode.Range(
    new vscode.Position(classScope.startLine - 1, classScope.startCol - 1),
    new vscode.Position(classScope.endLine - 1, classScope.endCol - 1)
  );
  return { classString: document.getText(classRange), classRange: classRange };
}

function handleLoopChildNodes<
  V extends vscode.TextDocument,
  T extends TransferHTMLTextType,
  U extends GenerateHtmlInterface,
  P extends vscode.WorkspaceEdit
>(document: V, transferHtmlText: T, cssLayer: U, htmlEdit: P) {
  // 判断节点是否有 childNodes 有就根据 childNodes 递归
  if (
    "childNodes" in transferHtmlText &&
    transferHtmlText.childNodes.length > 0
  ) {
    transferHtmlText.childNodes.forEach((item: ChildNode) => {
      htmlGenerateOption(document, item, cssLayer, htmlEdit);
    });
  } else if ("content" in transferHtmlText) {
    // 如果没有 childNodes 就根据 content 递归
    const content: DocumentFragment = transferHtmlText.content;
    htmlGenerateOption(document, content, cssLayer, htmlEdit);
  }
}
