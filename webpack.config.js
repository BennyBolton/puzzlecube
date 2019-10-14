const { join } = require("path");

module.exports = {
    entry: "./src/index.ts",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.glsl$/,
                use: "raw-loader",
                exclude: /node_modules/
            },
            {
                test: /\.png/,
                use: "url-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: "bundle.js",
        path: join(__dirname, "public")
    }
};
