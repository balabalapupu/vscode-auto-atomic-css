import { handleTransCompoundtoSingle } from "../transfer/index";

/* eslint-disable curly */
const path = require("path");
const fs = require("fs-extra");
const read = require("read-css");
const less = require("less");
const ATOMICPATH = path.resolve(__dirname, "../../");
const dirRoot = ATOMICPATH + "/currentReadyCSS.css";

async function handleCurrentFile(test: string, _dirRoot: string) {
  return await new Promise((resolve, reject) => {
    less.render(test, (err: string, data: CSSTYPE) => {
      if (fs.existsSync(_dirRoot)) {
        fs.unlinkSync(_dirRoot);
      }
      fs.writeFile(_dirRoot, data.css, (err: any) => {
        if (err) return;
        resolve("success");
      });
    });
  });
}

export async function parseCurrentCSStoObject(
  resultText: string
): Promise<Map<string[], ObjectType>> {
  await handleCurrentFile(resultText, dirRoot);
  return await new Promise((resolve, rejects) => {
    read(dirRoot, (err: Error, data: ReadCssType) => {
      const { stylesheet } = data;
      const { rules } = stylesheet;
      const transferRes = handleTransferCSSRules(rules, new Map());
      resolve(transferRes);
    });
  });
}

function handleTransferCSSRules(
  rules: ReadCssStyleRuleType[],
  map: Map<string[], ObjectType>
) {
  rules.forEach((item: ReadCssStyleRuleType) => {
    const { declarations, selectors } = item;
    let currentDeclarations = {};
    const currentClassList = selectors[0]
      .split(".")
      .map((item) => item.trim())
      .reverse()
      .filter((item) => item !== "");
    declarations.forEach((_dItem: { property: string; value: string }) => {
      const { property, value } = _dItem;
      const transSingleStyle: StyleType = handleTransCompoundtoSingle(
        property,
        value
      );
      currentDeclarations = {
        ...currentDeclarations,
        ...transSingleStyle,
      };
      map.set(currentClassList, currentDeclarations);
    });
  });
  return map;
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

export function generateOutputCSSStyle(
  commonStyleList: DeepObjectType,
  transferRes: Map<string[], ObjectType>
): GenerateOutputCssStyleType {
  const newMap: GenerateOutputCssStyleType = new Map();
  [...transferRes.entries()].forEach((item) => {
    const [key, value] = item;
    const { fixedList, notFixedCSSList } = handleGenerateOutputCSSStyle(
      commonStyleList,
      value
    );
    newMap.set(key, {
      fixedList: fixedList,
      notFixedCSSList: notFixedCSSList,
    });
  });
  return newMap;
}

function handleGenerateOutputCSSStyle(
  commonStyleList: DeepObjectType,
  styleList: ObjectType
): {
  fixedList: string[];
  notFixedCSSList: ObjectType;
} {
  const fixedList: string[] = [];
  const notFixedCSSList: ObjectType = {};

  Object.keys(styleList).forEach((item) => {
    const value = styleList[item];
    if (commonStyleList[item]) {
      const commonList = Reflect.ownKeys(commonStyleList[item]) as string[];
      const commonIndex = commonList.findIndex(
        (_item) => _item.toLowerCase() === value.toLowerCase()
      );
      if (commonIndex !== -1) {
        const commonClass = commonStyleList[item][commonList[commonIndex]];
        fixedList.push(commonClass);
      } else {
        notFixedCSSList[item] = styleList[item];
      }
    } else {
      notFixedCSSList[item] = styleList[item];
    }
  });
  return {
    fixedList,
    notFixedCSSList,
  };
}

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
