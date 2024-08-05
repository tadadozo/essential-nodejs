import { mkdir } from "fs/promises";
import { rename, unlink, cp, rm, access } from "fs/promises";
import fs from 'node:fs/promises';
import fs1, { readFile } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const files = class files {

    // #region basic
    static dirname(metaUrl) {
        return path.dirname(this.filename(metaUrl));
    }

    static filename(metaUrl) {
        return fileURLToPath(metaUrl);
    }

    static async pathExistsAsync(path) {
        try {
            await access(path);
            return true;
        }
        catch (e) {
            //console.log("-- check folder", e);
        }
        return false;
    }

    static async removeAsync(path, options) {
        await rm(path, options);
    }

    static async removeRecursiveAsync(path) {
        await rm(path, {
            force: true, //When true, exceptions will be ignored if path does not exist. Default: false.
            recursive: true
        });
    }

    static async renameAsync(sourcePath, targetPath) {
        await rename(sourcePath, targetPath);
    }

    static async deleteAsync(path) {
        await unlink(path);
    }

    static async mkdirAsync(path, options) {
        try {
            await mkdir(path, options);
        }
        catch (e) {
            //
            console.error("mkdir", path, e);
        }
    }

    static async mkdirRecursiveAsync(path, options) {
        if (!options){
            options = {
            };
        }
        options.recursive = true;
        try {
            await mkdir(path, options);
        }
        catch (e) {
            //
            console.error("mkdir", path, e);
        }
    }
    // #endregion basics

   // #region read write

   static async writeJsonAsync(path, data, lineEnding) {
    let replacer = null;
    //--indent output
    let indent = 2;
    await this.writeTextAsync(path, JSON.stringify(data, replacer, indent), lineEnding);
}

static async readJsonAsync(path) {
    var data = await this.readTextAsync(path);
    return JSON.parse(data);
}

static async readJsonWithCommentsAsync(path) {
    var data = await this.readTextToArrayAsync(path);
    return JSON.parse(data.join("\r\n"));
}

static async logChunksAsync(readableStream) {
    for await (const chunk of readableStream) {
        console.log(chunk);
    }
}

static async readCsvAsync(path, options) {
    if (!this.csvparser) {
        throw new Error("no csvparser declared. call core.helper.setupCsvParser(csvparser).");
    }

    if (!options) {
        options = this.csvparseroptions;
    }


    return this.promisify2(this.readCsvWithCallback.bind(this), path, options);
}


static readCsvWithCallback(path, options, callback) {
    if (!options) {
        options = {
            separator: ';'
        };
    }
    if (!this.csvparser) {
        throw new Error("no csvparser declared. call core.helper.setupCsvParser(csvparser).");
    }

    let results = [];

    fs1.createReadStream(path)
        .pipe(this.csvparser(options))
        .on('data', (data) => results.push(data))
        .on('end', () => {
            callback(results);
        });
}

static async readXmlAsJsonAsync(xml2js, path, options) {
    if (!xml2js) {
        throw new Error(`xml2js is not defined. Please use 'import * as xml2js from "xml2js";'`);
    }
    if ("string" === typeof (xml2js)) {
        throw new Error(`wrong arguments, call helper.readXmlAsJsonAsync(xml2js, path, options), because we need xml2js to parse the xml`);
    }

    var data = await this.readTextAsync(path);

    if (!options) {
        options = {
            explicitArray: false,
            trim: true
        };
    }

    var parser = new xml2js.Parser(options);
    var json = await parser.parseStringPromise(data);
    return json;
}

static async writeBase64AsBinaryAsync(path, data){
if (this.logWrites) { console.log("⏬", "WRITE", chalk.blue(path)); }
var buffer = Buffer.from(data, 'base64');
var f = await fs.open(path, 'w');
await f.writeFile(buffer);
await f.close();
}

static async readBinaryAsBase64Async(path) {
if (this.logReads) { console.log("⏫", "READ", chalk.blue(path)); }
let buffer = await this.readBufferAsync(path);
let _buffer = new Buffer.from(buffer, 'base64');
return _buffer.toString('base64');
}

static async readTextAsync(path, encoding) {
if (this.logReads) { console.log("⏫", "READ", chalk.blue(path)); } 
//console.log("read", path);
    let buffer = await this.readBufferAsync(path);
    if (!encoding) {
        encoding = "utf-8";
    }
    let data = new TextDecoder(encoding, { ignoreBOM: false }).decode(buffer);
    //console.log("start sequence", data.charCodeAt(0), data.charCodeAt(1), data.charCodeAt(2), data.charCodeAt(3), data.substring(0,2), path);
    //if (65533 === data.charCodeAt(0) && 65533 === data.charCodeAt(0)) {
    //  data = data.substr(2);
    //}
    //console.log("start sequence", data.charCodeAt(0), data.charCodeAt(1), data.charCodeAt(2), data.charCodeAt(3), data.substring(0, 2), path);
    return data;
}

static async readBufferAsync(path) {
    //console.log("file.read", path);
    var f = await fs.open(path, 'r');
    var buffer = await f.readFile();
    await f.close();
    return buffer;
}

static async writeBufferAsync(path, data) {
//console.log("file.write", path);
var f = await fs.open(path, 'w');
await f.writeFile(Buffer.from(data));
await f.close();
}

static stringifyIndented(data) {
    let replacer = null;
    let indent = 2;
    return JSON.stringify(data, replacer, indent);
}

static parse(content) {
    return JSON.parse(content);
}

static convertCRLF2LF(s) {
    return s ? s.replace(/\r\n/g, "\n") : s;
}

static convertLF2CRLF(s) {

    return s && !s.includes("\r\n") ? s.replace(/\n/g, "\r\n") : s;
}

static convertLineEnding(s, lineEnding) {
    
    if (s) {
        if (typeof (s) !== "string") {
            console.error("ERROR: input is not of type string", s);
            throw "input is not of type string";
        }
        if ("crlf" === lineEnding) {
            return this.convertLF2CRLF(s);
        }
        if ("lf" === lineEnding) {
            return this.convertCRLF2LF(s);
        }
    }

    return s;
}

static async writeTextAsync(path, data, lineEnding) {
if (this.logWrites) { console.log("⏬", "WRITE", chalk.blue(path)); }
    if (!lineEnding) {
        lineEnding = this.lineEnding;
    }
    //console.log("file.write", path);
    data = this.convertLineEnding(data, lineEnding);
    var f = await fs.open(path, 'w');
    await f.writeFile(data);
    await f.close();
}

static async readTextAsMapAsync(path) {
    var map = [];
    return await this.readTextToMapAsync(map, path);
}

static async readTextToMapAsync(map, path) {
let lines = await this.readTextToArrayAsync(path);
Enumerable.from(lines).forEach(p => {
  var key = p.trim();
  map[key] = true;
});

return map;
}

static wordsToMap(map, words, toLowerCase){
Enumerable.from(words).forEach(p => {
  var key = p.trim();
  if (toLowerCase){
    key = key.toLowerCase();
  }
  map[key] = true;
});

return map;
}

static async readTextToArrayAsync(path) {
var text = await this.readTextAsync(path);
var lines = this.convertToLines(text);
lines = Enumerable.from(lines)
  .select(p => p.trim())
  .where(p => p !== "")
  .where(p => !p.startsWith("//"))
  .select(p => p.split(" //")[0])
  .toArray();

return lines;
}

static async readWordMapperAsync(path) {
/*
A	As
Aachen	Aachens
Aal	Aale
Aal	Aalen
Aal	Aales
Aal	Aals
*/
var map = {};
return await this.readWordMapperToMapAsync(map, path);
}

static async readWordMapperToMapAsync(map, path) {
/*
A	As
Aachen	Aachens
Aal	Aale
Aal	Aalen
Aal	Aales
Aal	Aals
*/    
    var text = await this.readTextAsync(path);
    var lines = this.convertToLines(text);
    lines = Enumerable.from(lines)
        .select(p => p.trim())
  .where(p => p !== "")
  .where(p => !p.startsWith("//"))
  .select(p => p.split(" //")[0])

lines.forEach(p1 => {
  p1 = p1.replaceAll("\t", " ");
  let p = p1.split(" ");
  try{
    var value = p[0].trim().toLowerCase();
    var key = "";
    if (p.length > 1){
      key = p[1].trim().toLowerCase();
    }
    else {
      key = value;//just use that one entry as key and value
    }
    map[key] = value;
  }
  catch(e){
    console.error("mapping error", p1);
    throw e;
  }
    });
return map;
}

static async convertToWordMapperAsync(items) {
var map = {};
return await this.convertToWordMapperAsync(map, items);
}

static async convertToWordMapperAsync(map, items) {

items = Enumerable.from(items).select(p => p.trim()).toArray();
items.forEach(p1 => {
  p1 = p1.replaceAll("\t", " ");
  let p = p1.split(" ");
  try {
    var value = p[0].trim().toLowerCase();
    var key = "";
    if (p.length > 1) {
      key = p[1].trim().toLowerCase();
    }
    else {
      key = value;//just use that one entry as key and value
    }
    map[key] = value;
  }
  catch (e) {
    console.error("mapping error", p1);
    throw e;
  }
});
    return map;
}

static async readCsvAsMapAsync(path, separator, position) {
    if (!separator) {
        separator = ";";
    }
    if (!position) {
        position = 0;
    }
    var text = await this.readTextAsync(path);
    var lines = this.convertToLines(text);
    var map = [];
    Enumerable.from(lines).forEach(pline => {
        var line = pline.trim();
        var split = line.split(separator);
        var key = split[position];
        map[key] = true;
    });

    return map;
}

static mergeMaps(map, mapToMergeFrom) {
for (var p in mapToMergeFrom) {
  map[p] = mapToMergeFrom[p];
}
}

static convertMapKeysToLower(map) {
let map1 = {}
for (var p in map) {
  map1[p.toLowerCase()] = map[p];
}
return map1;
}

//# endregion read write

};