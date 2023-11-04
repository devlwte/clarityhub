const path = require("path");
const fs = require("fs");


const lib = [
    {
        method: "get",
        path: `/lib/*`,
        handler: async (req, res) => {
            const extName = path.extname(req.params[0]);

            // Tipos de contenido
            const contentTypes = {
                ".css": "text/css",
                ".js": "text/javascript",
                ".json": "application/json",
                ".png": "image/png",
                ".ico": "image/x-icon",
                ".jpg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".mp3": "audio/mpeg",
                ".mp4": "video/mp4",
            };

            const contentType = contentTypes[extName] || "text/html";

            res.writeHead(200, { "Content-Type": contentType });

            
            const nameFile = path.join(__dirname, "libraries", req.params[0]);

            const readStream = fs.createReadStream(nameFile);

            readStream.pipe(res);
        },
    }
]

module.exports = lib;
