/* eslint-disable curly */
import * as vscode from "vscode";
import { Document, parse } from "parse5";

interface ASTType {
  currentPageTemplace: string;
  convertedCssStyle: ConvertedCssStyleType;
}
/**
 * We use parse5 to convert html and generate ast structure, we need to use the class positioning in this ast structure
 * @param edit vscode editor
 * @param param1 currentPageTemplace is the content in the intercepted template tag,
 *  the convertedCssStyle is the converted css object
 * @param document VScode context
 */
export function handleHTMLBuParse5<T extends ASTType>(
  edit: vscode.WorkspaceEdit,
  { currentPageTemplace, convertedCssStyle }: T,
  document: vscode.TextDocument
) {
  const text: Document = parse(currentPageTemplace, {
    sourceCodeLocationInfo: true,
  });
  deepSearchASTFindAttribute(
    edit,
    text.childNodes[0],
    convertedCssStyle,
    document
  );
}

/**
 * determine if the class in the current hierarchy is the class we want to modify,
 * if so, process this hierarchy.
 * In addition, no matter whether the class is hit or not, we have to keep recursing the ast structure to find the next level
 * where we can do some pruning optimization
 * @param edit vscode editor
 * @param currentNode AST childNode
 * @param convertedCssStyle the converted css object
 * @param document VScode context
 */
function deepSearchASTFindAttribute(
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
      deepSearchASTFindAttribute(edit, node, convertedCssStyle, document);
    });
  } else if (currentNode.content) {
    const childNodes = currentNode.content.childNodes;
    childNodes.forEach((node: any) => {
      if (node.nodeName === "#text") return;
      deepSearchASTFindAttribute(edit, node, convertedCssStyle, document);
    });
  }
}

/**
 * take out the current html structure,
 * now extract the current level and change it to the correct class, and then go down recursively
 */
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
      deepSearchASTFindAttribute(
        edit,
        node,
        currentStyleLayerAttribute.children,
        document
      );
    });
  } else if (currentNode.content) {
    const childNodes = currentNode.content.childNodes;
    childNodes.forEach((node: any) => {
      if (node.nodeName === "#text") return;
      deepSearchASTFindAttribute(
        edit,
        node,
        currentStyleLayerAttribute.children,
        document
      );
    });
  }
}
