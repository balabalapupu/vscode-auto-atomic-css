/* eslint-disable curly */

import * as vscode from "vscode";
const path = require("path");
const fs = require("fs-extra");
const less = require("less");
const read = require("read-css");

import { TARGETPATH } from "../constance/index";
const ATOMICPATH = path.resolve(__dirname, "../../");

/**
 * @param data the result of read-css's ast structure,
 * we also use the declarations params to generate a resvered constructure
 * @returns a resvered constructure that the property values are before their class names
 */
function handleCallback(data: ReadCssType): {
  singleStyleTypeStore: IObjectStyleType;
  multiStyleTypeStore: MultiStyleTypeStoreType;
} {
  const singleStyleTypeStore: IObjectStyleType = {};
  const multiStyleTypeStore: MultiStyleTypeStoreType = new Map();
  if (!data.stylesheet) return { singleStyleTypeStore, multiStyleTypeStore };
  data.stylesheet.rules.forEach((item: ReadCssStyleRuleType) => {
    const { declarations, selectors } = item;
    // 单属性读取逻辑 给css用
    if (declarations.length === 1) {
      const _singleHub: ReadCssStyleDeclarationsType = declarations[0];
      if (_singleHub.type !== "declaration") return;
      const { property, value } = _singleHub;
      if (singleStyleTypeStore[property]) {
        singleStyleTypeStore[property][value] = selectors[0].split(".")[1];
      } else {
        singleStyleTypeStore[property] = {
          [value]: selectors[0].split(".")[1],
        };
      }
      // 多属性读取逻辑，给 html 用
    } else {
      const key = declarations.reduce(
        (pre: string[], val: ReadCssStyleDeclarationsType) => {
          return [...pre, val.property];
        },
        []
      );
      const value = selectors[0].split(".")[1];
      multiStyleTypeStore.set(key, value);
    }
  });
  return { singleStyleTypeStore, multiStyleTypeStore };
}

export function handleDeleteFile(target: string[] | string) {
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

export async function getBaseStyleConfig(
  entryPath: string,
  stylehubConfig: string
): Promise<{
  singleStyleTypeStore: IObjectStyleType;
  multiStyleTypeStore: MultiStyleTypeStoreType;
}> {
  return new Promise(async (resolve, reject) => {
    let cssJson = "";
    // 取出公共 css
    if (stylehubConfig !== "") {
      if (!fs.existsSync(stylehubConfig)) return;
      cssJson = await fs.readFileSync(stylehubConfig).toString();
    }

    if (entryPath !== "") {
      const fileType = entryPath.split(".").slice(-1)[0];
      if (fileType === "css") {
        cssJson += await fs.readFileSync(entryPath).toString();
      } else if (fileType === "less") {
        const res = await getReversedCSSBeta(entryPath);
        cssJson += res;
      }
    }
    const dirRoot = ATOMICPATH + "/outputReadyCSSBeta.css";
    handleDeleteFile(dirRoot);
    fs.writeFile(dirRoot, cssJson, (err: any) => {
      if (err) return;
      read(dirRoot, (err: Error, data: ReadCssType) => {
        const { singleStyleTypeStore, multiStyleTypeStore } =
          handleCallback(data);
        if (err) reject(err);
        resolve({ singleStyleTypeStore, multiStyleTypeStore });
      });
    });
  });
}

function getReversedCSSBeta(entry: string) {
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
        resolve(data.css);
      }
    );
  });
}
