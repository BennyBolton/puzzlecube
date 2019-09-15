"use strict";


const { readFile, readdir } = require("fs");
const { resolve } = require("path");
const http = require("http");


function getMimetype(file) {
    let match = file.match(/\.[^\.]+$/);
    switch (match && match[0].toLowerCase()) {
        case ".html": return "text/html";
        case ".css": return "text/css";
        case ".js": return "application/javascript";
        case ".svg": return "image/svg+xml";
        case ".png": return "image/png";
        default: return "text/plain";
    }
}


let publicPath = resolve(__dirname, "public");
let lookup = new Map();

lookup.set("/", resolve(publicPath, "index.html"));


let server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method != "GET" || !lookup.has(req.url)) {
        res.statusCode = 404;
        res.end("Not found");
    } else {
        let path = lookup.get(req.url);
        readFile(path, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err.stack || err.toString());
                console.error(err.stack || err);
            } else {
                res.setHeader("Content-Type", getMimetype(path));
                res.statusCode = 200;
                res.end(data);
            }
        });
    }
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
