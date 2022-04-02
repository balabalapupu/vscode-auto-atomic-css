/* eslint-disable curly */
import * as vscode from "vscode";
import {
  Document,
  DocumentFragment,
  Element,
  ElementLocation,
  Location,
  parse,
} from "parse5";

interface ChildHTMLNodeInterface {
  childNodes: ChildHTMLNodeInterface[];
  nodeName: string;
  sourceCodeLocation: ElementLocation | undefined;
  parentClassTree: string[];
  class?: string;
  style?: string;
}

export function createHtmlFixedStyle(
  document: vscode.TextDocument,
  outputCSS: GenerateOutputCssStyleType,
  editTemplate: TEditInterface
) {
  // 找到 template 范围
  const currentPageTemplace: string = handleFindScoreOfTemplate(document);

  // 解析模板
  const text: Document = htmlParseOption(currentPageTemplace);

  // 模板语法转换
  const transferHtmlText: ChildHTMLNodeInterface = htmlTransterOption(
    text.childNodes[0]
  );
  if (!transferHtmlText) return editTemplate;

  // ast 生成需要处理的范围
  htmlGenerateOptionBeta(document, transferHtmlText, outputCSS, editTemplate);

  return editTemplate;
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

function htmlTransterOption(text: any): ChildHTMLNodeInterface {
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
  const resultHtmlText = revertHtmlOption(current, []);
  return resultHtmlText;
}

function revertHtmlOption(currentHTML: any, classTree: string[]) {
  const { nodeName, sourceCodeLocation } = currentHTML as Element;
  let newHtmlText: ChildHTMLNodeInterface = {
    childNodes: [],
    nodeName: nodeName,
    sourceCodeLocation: sourceCodeLocation,
    parentClassTree: [],
  };
  const currentClassTree = JSON.parse(JSON.stringify(classTree));
  let checkCurrentClassCheck = "";
  if (currentHTML.attrs && currentHTML.attrs.length > 0) {
    const attrsList: IStyleType = {};
    currentHTML.attrs.forEach((item: { name: string; value: any }) => {
      attrsList[item.name] = item.value;
      if (item.name === "class") {
        checkCurrentClassCheck = item.value;
      }
    });
    newHtmlText = {
      ...newHtmlText,
      ...attrsList,
    };
  }
  currentClassTree.push(checkCurrentClassCheck);
  newHtmlText.parentClassTree = currentClassTree;
  currentHTML.childNodes &&
    currentHTML.childNodes.forEach((item: any) => {
      if (item.nodeName === "#text") return;
      if (item.nodeName === "template") {
        const { content } = item as unknown as { content: any };
        const childSource = revertHtmlOption(content, currentClassTree);
        newHtmlText.childNodes.push(childSource);
      } else {
        const _item = item as Element;
        const childSource = revertHtmlOption(_item, currentClassTree);
        newHtmlText.childNodes.push(childSource);
      }
    });
  return newHtmlText;
}

function htmlGenerateOptionBeta<
  V extends vscode.TextDocument,
  T extends ChildHTMLNodeInterface,
  U extends GenerateOutputCssStyleType,
  P extends TEditInterface
>(document: V, transferHtmlText: T, outputCSS: U, editTemplate: P): P {
  if (transferHtmlText.nodeName === "#text") return editTemplate;
  if (transferHtmlText.class && transferHtmlText.class !== "") {
    const { parentClassTree } = transferHtmlText;
    const currentNodeClassList = transferHtmlText.class.split(" ");

    const targetStyleMap: GenerateOutputCssStyleType = handleTargetClassStyle(
      currentNodeClassList,
      outputCSS,
      parentClassTree.slice(0, -1)
    );
    handletargetStyle(document, targetStyleMap, transferHtmlText, editTemplate);
  }

  handleLoopChildNodes(document, transferHtmlText, outputCSS, editTemplate);

  return editTemplate;
}

function handletargetStyle(
  document: vscode.TextDocument,
  targetStyleMap: GenerateOutputCssStyleType,
  transferHtmlText: ChildHTMLNodeInterface,
  editTemplate: TEditInterface
) {
  if ([...targetStyleMap.keys()].length === 0) return;
  const outputList: GenerateOutputCssStyleInterface = {
    fixedList: [],
    notFixedCSSList: {},
  };
  targetStyleMap.forEach((item) => {
    outputList.fixedList.push(...item.fixedList);
    outputList.notFixedCSSList = {
      ...outputList.notFixedCSSList,
      ...item.notFixedCSSList,
    };
  });

  // 1. 改造 class
  const classScope = transferHtmlText.sourceCodeLocation?.attrs?.class;
  // 输出当前 字符串 和 范围
  const { classRange } = handleFindScoreFromOffset(
    document,
    classScope,
    transferHtmlText
  );
  const originClassList = transferHtmlText.class
    ? transferHtmlText.class.split(" ")
    : [];
  const set = new Set([...originClassList, ...outputList.fixedList]);
  const newClassList = Array.from(set);
  const newClass = `class="${newClassList.join(" ")}"`;
  editTemplate.classEdit.push({
    range: classRange,
    text: newClass,
  });

  // 2. 改造 style
  if (Object.keys(outputList.notFixedCSSList).length > 0) {
    const styleScope = transferHtmlText.sourceCodeLocation?.attrs?.style;
    const { classString: styleString, classRange: styleRange } =
      handleFindScoreFromOffset(document, styleScope, transferHtmlText);
    let originStyleList = transferHtmlText.style
      ? transferHtmlText.style.split(";")
      : [];
    originStyleList.map((item) => item.trim());
    const notFixedStyleList = Object.keys(outputList.notFixedCSSList).map(
      (item) => {
        const value = outputList.notFixedCSSList[item];
        return `${item}: ${value}`;
      }
    );
    const set = new Set([...originStyleList, ...notFixedStyleList]);
    const newStyleList = Array.from(set);
    const newStyle =
      styleString === ""
        ? ` style="${newStyleList.join(";")}" `
        : `style="${newStyleList.join(";")}"`;

    editTemplate.styleEdit.push({
      range: styleRange,
      text: newStyle,
    });
  }
}

function handleTargetClassStyle(
  currentNodeClassList: string[],
  outputCSS: GenerateOutputCssStyleType,
  parentClass: string[]
): GenerateOutputCssStyleType {
  // 获取 CSS map 中的 key
  const outputCSSMapKeys = [...outputCSS.keys()];
  // 准备输出的 CSS map： 存储可以用的样式
  const targetClassMap: GenerateOutputCssStyleType = new Map();

  outputCSSMapKeys.forEach((item: string[]) => {
    const targetClass = item[0];
    if (currentNodeClassList.includes(targetClass)) {
      const check = isTreeNode(item.slice(1), parentClass);
      if (check) {
        const targetStyle = outputCSS.get(item);
        targetStyle && targetClassMap.set(item, targetStyle);
      }
    }
  });

  return targetClassMap;
}

function isTreeNode(
  targetClassList: string[],
  parentClassTree: string[]
): boolean {
  const _targetTree = JSON.parse(JSON.stringify(targetClassList));
  parentClassTree.forEach((item) => {
    const itemList = item.split(" ");
    if (itemList.includes(_targetTree[0])) {
      _targetTree.shift();
    }
  });
  return _targetTree.length === 0;
}

function handleFindScoreFromOffset(
  document: vscode.TextDocument,
  classScope: Location | undefined,
  transferHtmlText: ChildHTMLNodeInterface
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
  T extends ChildHTMLNodeInterface,
  U extends GenerateOutputCssStyleType,
  P extends TEditInterface
>(document: V, transferHtmlText: T, outputCSS: U, editTemplate: P) {
  transferHtmlText.childNodes.forEach((item: ChildHTMLNodeInterface) => {
    htmlGenerateOptionBeta(document, item, outputCSS, editTemplate);
  });
}
