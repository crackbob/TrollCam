const path = require("path");
const { UserscriptPlugin } = require("webpack-userscript");

const commonConfig = {
    mode: "production",
    entry: "./src/main.js",
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    }
};

const userscriptConfig = {
    ...commonConfig,
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "TrollCam.user.js",
    },
    plugins: [
        new UserscriptPlugin({
            metajs: false,
            headers: {
                name: "TrollCam",
                supportURL: "https://github.com/crackbob/TrollCam",
                description: "we do a little trolling",
                version: "1.0.0",
                author: "crackbob",
                match: "*://app.zoom.us/*",
                grant: "none",
            },
        }),
    ],
};

const regularScriptConfig = {
    ...commonConfig,
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "TrollCam.min.js",
    },
    plugins: [],
};

module.exports = [userscriptConfig, regularScriptConfig];
