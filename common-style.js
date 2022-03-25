"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const read = require("read-css");
// var fs = require("fs");
const path = require("path");
const fs = require("fs-extra");
const less = require("less");
function getCommonStyle(document) {
    const ROOT = "/Users/wangtianyou/Desktop/vscode/auto-atomic-css/style/stylehub.less";
    const ROOTARR = ROOT.split("/");
    const ATOMICPATH = path.resolve(__dirname, "../../src/utils");
    const ROOTPATH = ROOTARR.slice(0, -1).join("/");
    const ROOTNAME = ROOTARR.slice(-1);
    const readFileList = fs.readdirSync(ROOTPATH);
    function handleDeleteFile(target) {
        if (!Array.isArray(target)) {
            const currentFile = ATOMICPATH + "/" + target;
            if (!fs.existsSync(currentFile))
                return;
            fs.unlinkSync(currentFile);
        }
        else {
            target.forEach((item) => {
                const currentFile = ATOMICPATH + "/" + item;
                if (fs.existsSync(currentFile)) {
                    fs.unlinkSync(currentFile);
                }
            });
        }
    }
    handleDeleteFile(readFileList);
    handleDeleteFile("result.css");
    fs.copy(ROOTPATH, ATOMICPATH, (err) => {
        if (err)
            return console.log(err, "copyError");
        const mainFile = ATOMICPATH + "/" + ROOTNAME;
        if (!fs.existsSync(mainFile)) {
            handleDeleteFile(readFileList);
            return;
        }
        setTimeout(() => {
            let mainFileData = fs.readFileSync(mainFile);
            mainFileData = mainFileData.toString();
            console.log(mainFile, "------", mainFileData);
            less.render(mainFileData, function (e, css) {
                const dirRoot = ATOMICPATH + "/outputReadyCSS.css";
                fs.writeFile(dirRoot, css.css, (err) => {
                    if (err)
                        return;
                    handleDeleteFile(readFileList);
                });
            });
        }, 200);
    });
}
exports.default = getCommonStyle;
//# sourceMappingURL=common-style.js.map