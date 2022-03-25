/* eslint-disable curly */
/**
 * Convert the current style sheet in string form into js-readable object form output,
 * which is convenient for subsequent style processing.
 * @param resultText String format stylesheet for the current class in css
 * @returns
 */
export function parseCurrentCSS({ resultText }: { resultText: string }): {
  outputClassName: string;
  transOutputStyleObject: DeepObjectType;
} {
  const transJSONText = JSON.stringify(resultText)
    .trim()
    .split("\\n")
    .join("")
    .replace(/^"([^"]+)"$/, (match, p1) => p1)
    .split(" ")
    .join("");
  const styleObject: DeepObjectType = JSON.parse(
    `{${transJSONText
      .replaceAll(";", ",")
      .replaceAll("{", ":{")
      .replaceAll(/([\.])([\w\-]+)([\:])/g, (m, a, b, c) => `"${a}${b}"${c}`)
      .replaceAll(/([\{\,])([\w\-]+)([\:])/g, (m, a, b, c) => `${a}"${b}"${c}`)
      .replaceAll(/([\:])([\w\-\%]+)([\,])/g, (m, a, b, c) => `${a}"${b}"${c}`)
      .replaceAll(/(\")(\,)(\})/g, (m, a, b, c) => `${a}${c}`)}}`
  );
  return {
    outputClassName: Reflect.ownKeys(styleObject)[0] as string,
    transOutputStyleObject: styleObject,
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
      fixedClassName: [name],
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
