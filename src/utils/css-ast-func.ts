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
): Promise<Map<string[], IStyleType>> {
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
  map: Map<string[], IStyleType>
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
      const transSingleStyle: IStyleType = handleTransCompoundtoSingle(
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

export function generateOutputCSSStyle(
  commonStyleList: IObjectStyleType,
  transferRes: Map<string[], IStyleType>
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
  commonStyleList: IObjectStyleType,
  styleList: IStyleType
): {
  fixedList: string[];
  notFixedCSSList: IStyleType;
} {
  const fixedList: string[] = [];
  const notFixedCSSList: IStyleType = {};

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
