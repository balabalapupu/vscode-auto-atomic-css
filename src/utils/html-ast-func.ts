/* eslint-disable curly */
import * as vscode from "vscode";
import { Document, parse } from "parse5";

interface ASTInputType {
  currentPageTemplace: string;
  convertedCssStyle: ConvertedCssStyleType;
}
export function handleHTMLtoAST<T extends ASTInputType>(
  edit: vscode.WorkspaceEdit,
  { currentPageTemplace, convertedCssStyle }: T,
  document: vscode.TextDocument
) {
  const targetMainClass = Reflect.ownKeys(convertedCssStyle)[0] as string;
  const targetMainAttribute = convertedCssStyle[targetMainClass];
  const text: Document = parse(currentPageTemplace, {
    sourceCodeLocationInfo: true,
  });
  loopAST(edit, text.childNodes[0], convertedCssStyle, document);
}

function loopAST(
  edit: vscode.WorkspaceEdit,
  currentNode: any,
  convertedCssStyle: ConvertedCssStyleType,
  document: vscode.TextDocument
) {
  if (currentNode.nodeName === "style" || currentNode.nodeName === "#text")
    return;
  if (currentNode.attrs) {
    currentNode.attrs.forEach((item: any) => {
      if (item.name !== "class") return;
      const _classList = Reflect.ownKeys(convertedCssStyle); // { xxx: {a: 1}, ccc: {b: 3}}  [xxx, ccc]
      const _currentClass = item.value.split(" "); // ['xxx', 'xx1', 'xx2']
      _classList.forEach((_item) => {
        if (typeof _item !== "string") return;
        const _name = _item.split(".")[1];
        if (!_currentClass.includes(_name)) return;
        transferClassAttribute(
          edit,
          currentNode,
          _name,
          convertedCssStyle[_item],
          document
        );
      });
    });
  }
  if (currentNode.childNodes.length > 0) {
    currentNode.childNodes.forEach((node: any) => {
      if (node.nodeName === "#text") return;
      loopAST(edit, node, convertedCssStyle, document);
    });
  } else if (currentNode.content) {
    const childNodes = currentNode.content.childNodes;
    childNodes.forEach((node: any) => {
      if (node.nodeName === "#text") return;
      loopAST(edit, node, convertedCssStyle, document);
    });
  }
}

// 把当前 html 结构取出，现将当前层级提取出来改成正确的 class ，然后在递归下去
function transferClassAttribute(
  edit: vscode.WorkspaceEdit,
  currentNode: any,
  currentStyleName: string,
  currentStyleLayerAttribute: TransferCSSDataByCommonCssConfigType,
  document: vscode.TextDocument
) {
  const { startLine, startCol, endLine, endCol } =
    currentNode.sourceCodeLocation.attrs.class;
  const classRange = new vscode.Range(
    new vscode.Position(startLine - 1, startCol - 1),
    new vscode.Position(endLine - 1, endCol - 1)
  );
  const currentNodeClass = currentNode.attrs.find(
    (item: any) => item.name === "class"
  );
  const currentNodeClassList = currentNodeClass.value.split(" ");
  const currentNodeClassIndex = currentNodeClassList.findIndex(
    (item: string) => item === currentStyleName
  );
  currentNodeClassList[currentNodeClassIndex] =
    currentStyleLayerAttribute.fixedClassName.join(" ");
  edit.replace(
    document.uri,
    classRange,
    `class="${currentNodeClassList.join(" ")}"`
  );

  if (currentNode.childNodes.length > 0) {
    currentNode.childNodes.forEach((node: any) => {
      if (node.nodeName === "#text") return;
      loopAST(edit, node, currentStyleLayerAttribute.children, document);
    });
  } else if (currentNode.content) {
    const childNodes = currentNode.content.childNodes;
    childNodes.forEach((node: any) => {
      if (node.nodeName === "#text") return;
      loopAST(edit, node, currentStyleLayerAttribute.children, document);
    });
  }
}
