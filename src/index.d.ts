declare module "espree" {
  function parse(a: string): string;
}

type IStyleType = {
  [propName: string]: string;
};

type IObjectStyleType = {
  [propName: string]: IStyleType;
};
type DFSObjectType = {
  [propName: string]: string | IStyleType;
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
  position: IStyleType;
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

type MultiStyleTypeStoreType = Map<string[], string>;
interface TransOutputStyleObjectInterface {
  children: {
    [propsname: string]: TransOutputStyleObjectInterface;
  };
  style: IStyleType;
}

interface GenerateOutputCssStyleInterface {
  fixedList: string[];
  notFixedCSSList: {
    [key: string]: string;
  };
}

type GenerateOutputCssStyleType = Map<
  string[],
  GenerateOutputCssStyleInterface
>;

interface DEditIntereface {
  range: unknown;
  text: string;
}
interface TEditInterface {
  classEdit: DEditIntereface[];
  styleEdit: DEditIntereface[];
}
