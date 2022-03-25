/* eslint-disable curly */
const path = require("path");
const fs = require("fs-extra");
const less = require("less");
const read = require("read-css");

import { TARGETPATH } from "../constance/index";
const ATOMICPATH = path.resolve(__dirname, "../../");

/**
 * Read the less atomic css style sheet through less.render and convert it into css style sheet,
 * and then return it into ast format through read-css.
 * @returns Promise<DeepObjectType> the DeepObjectType is a css ast construct
 */
export default async function getCommonStyle(
  entry: string
): Promise<DeepObjectType> {
  return await new Promise(async (resolve, reject) => {
    await getReversedCSS(entry);
    const dirRoot = ATOMICPATH + TARGETPATH;
    read(dirRoot, (err: Error, data: ReadCssType) => {
      const res: DeepObjectType = handleCallback(data);
      if (err) reject(err);
      resolve(res);
    });
  });
}

/**
 * @param data the result of read-css's ast structure,
 * we also use the declarations params to generate a resvered constructure
 * @returns a resvered constructure that the property values are before their class names
 */
function handleCallback(data: ReadCssType): DeepObjectType {
  const styleStore: DeepObjectType = {};
  if (!data.stylesheet) return styleStore;
  data.stylesheet.rules.forEach((item: ReadCssStyleRuleType) => {
    const { declarations, selectors } = item;
    declarations.forEach((_item: ReadCssStyleDeclarationsType) => {
      if (_item.type !== "declaration") return;
      const { property, value } = _item;
      if (styleStore[property]) {
        styleStore[property][value] = selectors[0].split(".")[1];
      } else {
        styleStore[property] = {
          [value]: selectors[0].split(".")[1],
        };
      }
    });
  });
  return styleStore;
}

/**
 * read the result of less.render() and write result into root
 */
function getReversedCSS(entry: string) {
  const ROOTARR = entry.split("/");
  const ROOTPATH = ROOTARR.slice(0, -1).join("/");
  const ROOTNAME = ROOTARR.slice(-1);
  return new Promise((resolve, reject) => {
    handleDeleteFile("result.css");
    if (!fs.existsSync(entry)) return;
    const currentStyleFile = fs.readFileSync(entry);
    less.render(
      currentStyleFile.toString(),
      { filename: path.resolve(ROOTPATH, `./${ROOTNAME}`) },
      (err: string, data: CSSTYPE) => {
        const dirRoot = ATOMICPATH + TARGETPATH;
        fs.writeFile(dirRoot, data.css, (err: any) => {
          if (err) {
            reject("error");
            return;
          }
          resolve("success");
        });
      }
    );
  });
}
function handleDeleteFile(target: string[] | string) {
  if (!Array.isArray(target)) {
    const currentFile = ATOMICPATH + "/" + target;
    if (!fs.existsSync(currentFile)) return;
    fs.unlinkSync(currentFile);
  } else {
    target.forEach((item) => {
      const currentFile = ATOMICPATH + "/" + item;
      if (fs.existsSync(currentFile)) {
        fs.unlinkSync(currentFile);
      }
    });
  }
}
