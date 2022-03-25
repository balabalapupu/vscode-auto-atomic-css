declare module "espree" {
  function parse(a: string): string;
}
type outputCss = {
  fixedClassName: string;
  notFixedCss: {
    [propName: string]: string;
  };
  children: {
    [propName: string]: outputCss;
  };
};

type ConvertedCssType = {
  [propName: string]: outputCss;
};
type StyleType = {
  [propName: string]: string;
};
type StyleListType = {
  [propName: string]:
    | string
    | {
        [propName: string]: string;
      };
};

type AstType = {
  attrs: {
    [propName: string]: string;
  };
  type: string;
  name: string;
  voidElement: boolean;
  children: AstType[];
};

type ObjectType = {
  [propName: string]: string;
};

type AnalyzedClassLabelType = {
  fixedClassName: string;
  notFixedCss: {
    [propName: string]: string;
  };
  children: {
    [propName: string]: AnalyzedClassLabelType;
  };
};
type DeepObjectType = {
  [propName: string]: {
    [propName: string]: string;
  };
};
type DFSObjectType = {
  [propName: string]:
    | string
    | {
        [propName: string]: string;
      };
};

type CSSTYPE = {
  css: string;
};
type ReadCssStyleDeclarationsType = {
  position: {
    [propsName: string]: string;
  };
  property: string;
  type: string;
  value: string;
};
type ReadCssStyleRuleType = {
  declarations: ReadCssStyleDeclarationsType[];
  position: {
    [propsName: string]: string;
  };
  selectors: string[];
  type: string;
};
type ReadCssStyleSheetType = {
  parsingErrors: [];
  rules: ReadCssStyleRuleType[];
  source: string;
};
type ReadCssType = {
  type: string;
  stylesheet: ReadCssStyleSheetType;
};

type ConvertedCssStyleType = {
  [propName: string]: TransferCSSDataByCommonCssConfigType;
};
type TransferCSSDataByCommonCssConfigType = {
  fixedClassName: string[];
  notFixedCss: {
    [propsname: string]: string;
  };
  children: {
    [propsname: string]: TransferCSSDataByCommonCssConfigType;
  };
};
