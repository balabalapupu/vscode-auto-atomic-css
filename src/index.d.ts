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
  [propName: string]: {
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
type ConvertedCssStyleType = {
  [propName: string]: AnalyzedClassLabelType;
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
