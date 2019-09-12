"use strict";


const { readFile, readdir } = require("fs");
const { resolve } = require("path");
const http = require("http");


let publicPath = resolve(__dirname, "public");
let lookup = new Map();

lookup.set("/", resolve(publicPath, "index.html"));


let server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    let path = lookup.get(req.url);
    if (req.method != "GET" || !path) {
        res.statusCode = 404;
        res.end("Not found");
    }
    readFile(path, (err, data) => {
        if (err) {
            res.statusCode = 500;
            res.end(err.stack || err.toString());
            console.error(err.stack || err);
        } else {
            res.statusCode = 200;
            res.end(data);
        }
    });
});

let port = +process.argv[2] || 8080;
server.listen(port, () => console.log(`Listening on port ${port}`));


readdir(publicPath, (err, files) => {
    if (err) {
        console.error(err.stack || err);
        process.exit(1);
    } else {
        for (let file of files) {
            let path = resolve(publicPath, file);
            console.log(`Found file /${file} => ${path}`);
            lookup.set(`/${file}`, path);
        }
    }
});
