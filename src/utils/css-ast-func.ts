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

export async function parseCurrentCSStoObject(resultText: string): Promise<{
  mainClassName: string;
  translatedStyleObject: TransOutputStyleObjectInterface;
}> {
  await handleCurrentFile(resultText, dirRoot);
  const transOutputStyleObject: TransOutputStyleObjectInterface = {
    children: {},
    style: {},
  };
  return await new Promise((resolve, rejects) => {
    read(dirRoot, (err: Error, data: ReadCssType) => {
      const { stylesheet } = data;
      const { rules } = stylesheet;
      const { mainClassName, translatedStyleObject } = transCssRules(
        transOutputStyleObject,
        rules
      );
      resolve({
        mainClassName,
        translatedStyleObject,
      });
    });
  });
}

function transCssRules(
  transOutputStyleObject: TransOutputStyleObjectInterface,
  rules: ReadCssStyleRuleType[]
): {
  mainClassName: string;
  translatedStyleObject: TransOutputStyleObjectInterface;
} {
  let _mainClass: string = "";
  rules.forEach((item) => {
    let _transOutputStyleObject: TransOutputStyleObjectInterface =
      transOutputStyleObject;
    const { declarations, selectors } = item;
    const _className = selectors[0].split(" ");
    const mainName = _className.slice(0, 1)[0];
    _mainClass = mainName;
    const childName = _className.slice(1);
    childName.forEach((_name, _index) => {
      // 处理嵌套层级
      if (!_transOutputStyleObject.children) {
        _transOutputStyleObject.children = {
          [_name]: {
            children: {},
            style: {},
          },
        };
        _transOutputStyleObject.style = {};

        _transOutputStyleObject = _transOutputStyleObject.children[_name];
      } else if (_transOutputStyleObject.children[_name]) {
        _transOutputStyleObject = _transOutputStyleObject.children[_name];
      } else {
        _transOutputStyleObject.children[_name] = {
          children: {},
          style: {},
        };
        _transOutputStyleObject = _transOutputStyleObject.children[_name];
      }
      // 处理子 style 样式
      if (_index === childName.length - 1) {
        declarations.forEach((_dItem) => {
          const { property, value } = _dItem;
          const transSingleStyle: StyleType = handleTransCompoundtoSingle(
            property,
            value
          );
          _transOutputStyleObject.style = {
            ..._transOutputStyleObject.style,
            ...transSingleStyle,
          };
        });
      }
    });
  });
  // 处理父样式
  const { declarations } = rules[0];
  declarations.forEach((item) => {
    const { property, value } = item;
    const transSingleStyle: StyleType = handleTransCompoundtoSingle(
      property,
      value
    );
    transOutputStyleObject.style = {
      ...transOutputStyleObject.style,
      ...transSingleStyle,
    };
  });
  return {
    mainClassName: _mainClass,
    translatedStyleObject: transOutputStyleObject,
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

export function generateOutputCSSStyle(
  translatedStyleObject: TransOutputStyleObjectInterface,
  commonStyleList: DeepObjectType,
  originOutPutCSSStyle: GenerateOutPutCSSStyle
): GenerateOutPutCSSStyle {
  const { fixedList, notFixedCSSList } = handleGenerateOutputCSSStyle(
    commonStyleList,
    translatedStyleObject.style
  );
  originOutPutCSSStyle.fixedClassName = fixedList;
  originOutPutCSSStyle.notFixedCSS = notFixedCSSList;
  originOutPutCSSStyle.children = {};
  Reflect.ownKeys(translatedStyleObject.children).forEach((item) => {
    if (typeof item !== "string") return;
    const currentLayerStyle: TransOutputStyleObjectInterface =
      translatedStyleObject.children[item];
    originOutPutCSSStyle.children[item] = {} as GenerateOutPutCSSStyle;
    const _originOutPutCSSStyle = originOutPutCSSStyle.children[item];
    generateOutputCSSStyle(
      currentLayerStyle,
      commonStyleList,
      _originOutPutCSSStyle
    );
  });
  return originOutPutCSSStyle;
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
