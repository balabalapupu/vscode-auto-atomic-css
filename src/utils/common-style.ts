/* eslint-disable curly */

import * as vscode from "vscode";
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
export default async function getCommonStyle(entry: string): Promise<
  | {
      singleStyleTypeStore: DeepObjectType;
      multiStyleTypeStore: MultiStyleTypeStoreType;
    }
  | "error"
> {
  return await new Promise(async (resolve, reject) => {
    const fileType = entry.split(".").slice(-1)[0];
    switch (fileType) {
      // less 文件转译
      case "less":
        await getReversedCSS(entry);
        const dirRoot = ATOMICPATH + TARGETPATH;
        read(dirRoot, (err: Error, data: ReadCssType) => {
          const { singleStyleTypeStore, multiStyleTypeStore } =
            handleCallback(data);
          if (err) reject(err);
          resolve({ singleStyleTypeStore, multiStyleTypeStore });
        });
        break;
      // css 直接处理
      case "css":
        read(entry, (err: Error, data: ReadCssType) => {
          const { singleStyleTypeStore, multiStyleTypeStore } =
            handleCallback(data);
          if (err) reject(err);
          resolve({ singleStyleTypeStore, multiStyleTypeStore });
        });
        break;

      default:
        vscode.window.showInformationMessage(
          `auto-atomic-css not support atomic file type: ${fileType}`
        );
        resolve("error");
        break;
    }
  });
}

/**
 * @param data the result of read-css's ast structure,
 * we also use the declarations params to generate a resvered constructure
 * @returns a resvered constructure that the property values are before their class names
 */
function handleCallback(data: ReadCssType): {
  singleStyleTypeStore: DeepObjectType;
  multiStyleTypeStore: MultiStyleTypeStoreType;
} {
  const singleStyleTypeStore: DeepObjectType = {};
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
