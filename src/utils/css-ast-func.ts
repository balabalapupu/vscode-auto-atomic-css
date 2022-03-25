import { rejects } from "assert";

/* eslint-disable curly */
const path = require("path");
const fs = require("fs-extra");
const read = require("read-css");
const less = require("less");
const ATOMICPATH = path.resolve(__dirname, "../../");
const dirRoot = ATOMICPATH + "/currentReadyCSS.css";

async function handleCurrentFile(test: string) {
  return await new Promise((resolve, reject) => {
    less.render(test, (err: string, data: CSSTYPE) => {
      if (fs.existsSync(dirRoot)) {
        fs.unlinkSync(dirRoot);
      }
      fs.writeFile(dirRoot, data.css, (err: any) => {
        if (err) return;
        resolve("success");
      });
    });
  });
}
function deepCreateCSSConfig(
  targetObj: any,
  index: number,
  selectors: string[],
  declaration: ReadCssStyleDeclarationsType[]
) {
  if (index === selectors.length) return;
  const currentName = selectors[index];
  if (!targetObj[currentName]) targetObj[currentName] = {};
  if (index === selectors.length - 1) {
    targetObj[currentName] = declaration.reduce((pre, val) => {
      return {
        ...pre,
        [val.property]: val.value,
      };
    }, targetObj[currentName]);
  }
  deepCreateCSSConfig(
    targetObj[currentName],
    index + 1,
    selectors,
    declaration
  );
}
/* eslint-disable curly */
/**
 * Convert the current style sheet in string form into js-readable object form output,
 * which is convenient for subsequent style processing.
 * @param resultText String format stylesheet for the current class in css
 * @returns
 */
export async function parseCurrentCSS({
  resultText,
}: {
  resultText: string;
}): Promise<{
  outputClassName: string;
  transOutputStyleObject: DeepObjectType;
}> {
  const res = await handleCurrentFile(resultText);
  let outputClassName = "";
  const returnObject: DeepObjectType = await new Promise((resolve, rejects) => {
    read(dirRoot, (err: Error, data: ReadCssType) => {
      const { stylesheet } = data;
      const { rules } = stylesheet;
      const resultObj: DeepObjectType = {};
      rules.forEach((item) => {
        const { declarations, selectors } = item;
        const _selectors = selectors[0].split(" ");
        outputClassName = _selectors[0];
        let _reusltObj: DeepObjectType = resultObj;
        deepCreateCSSConfig(_reusltObj, 0, _selectors, declarations);
      });
      resolve(resultObj);
    });
  });
  return {
    outputClassName: outputClassName,
    transOutputStyleObject: returnObject,
  };
}

/**
 * Convert the current css ast structure, because the style sheet has a nested relationship,
 * this function needs to distinguish whether the current value is a style attribute or the class name of the next level.
 * @param param0
 * @returns TransferCSSDataByCommonCssConfigType
 */
export function translateCurrentCSS({
  name,
  config,
  commonStyleList,
}: {
  name: string;
  config: DFSObjectType;
  commonStyleList: DeepObjectType;
}): TransferCSSDataByCommonCssConfigType {
  const transferCSSDataByCommonCssConfig: TransferCSSDataByCommonCssConfigType =
    {
      fixedClassName: [name.split(".")[1]],
      notFixedCss: {},
      children: {},
    };
  const currentLayerStyle = Reflect.ownKeys(config).filter(
    (item) => !item.toString().includes(".")
  ) as string[];
  const nextLayerStyle = Reflect.ownKeys(config).filter((item) =>
    item.toString().includes(".")
  ) as string[];
  currentLayerStyle.forEach((item: string) => {
    const currentLayerStyleKey = config[item] as string;
    if (commonStyleList[item] && commonStyleList[item][currentLayerStyleKey]) {
      transferCSSDataByCommonCssConfig.fixedClassName.push(
        commonStyleList[item][currentLayerStyleKey]
      );
    } else {
      transferCSSDataByCommonCssConfig.notFixedCss[item] = currentLayerStyleKey;
    }
  });
  nextLayerStyle.forEach((item: string) => {
    const currentLayerStyleKey = config[item] as DFSObjectType;
    transferCSSDataByCommonCssConfig.children[item] = translateCurrentCSS({
      name: item,
      config: currentLayerStyleKey,
      commonStyleList,
    });
  });
  return transferCSSDataByCommonCssConfig;
}

/**
 * Convert the css stylesheet of the current ast structure to string form to ready for fix errors
 * @param param0
 * @returns TransferCSSDataByCommonCssConfigType and name
 */
export function generateCurrentCSS({
  currentLayer,
  name,
}: {
  currentLayer: TransferCSSDataByCommonCssConfigType;
  name: string;
}): string {
  let resultName = `${name} {`;
  Reflect.ownKeys(currentLayer.notFixedCss).forEach((_item) => {
    if (typeof _item !== "string") return;
    resultName = resultName.concat(
      `\n${_item}: ${currentLayer.notFixedCss[_item]};`
    );
  });
  Reflect.ownKeys(currentLayer.children).forEach((_item) => {
    if (typeof _item !== "string") return;
    const v = generateCurrentCSS({
      currentLayer: currentLayer.children[_item],
      name: _item,
    });
    resultName = resultName.concat(`\n${v}`);
  });
  resultName = resultName.concat("\n}");
  return resultName;
}
