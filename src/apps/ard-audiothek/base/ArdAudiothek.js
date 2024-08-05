import { HttpClient } from "../../../libs/web/HttpClient.js";
import { files } from "../../../libs/core/files.js";
import { EnumerableExtensions } from "../../../libs/core/EnumerableExtensions.js";
import jsonata from "jsonata";


let jsn = async (data, expressionString, bindings) => {
    if (!bindings) {
        bindings = null;
    }
    let expression = jsonata(expressionString.trim());
    return await expression.evaluate(data, bindings);
};


export const ArdAudiothek = class {
    constructor(config) {
        this.config = config;
        this.client = null;
    }

    async initAsync(url) {
        if (!url) {
            url = "https://api.ardaudiothek.de/graphql";
        }
        this.client = await HttpClient.create(url);
    }

    async retrieveProgramSetAsync() {
        let data = await this.retrieveAsync(`/programsets/${this.config.id}`);
        await files.mkdirRecursiveAsync(`${this.config.path}`);
        await files.writeJsonAsync(`${this.config.path}/${this.config.name}-0-programset.json`, data);
    }

    async retrieveProgramSetWithQueryAsync(start, length) {
        let id = this.config.id;
        let offsetString = "";
        let firstString = "";
        if (start) {
            offsetString = ` offset:${start}`;
        }
        if (length) {
            firstString = ` first:${length}`;
        }

        //see _getTransformPodcast for what is needed here
        let q = `
{ 
  query:programSet(id:${id}){
    id title numberOfElements feedUrl feedUrl2 sharingUrl
    items(orderBy:PUBLISH_DATE_DESC${firstString}${offsetString}){
      nodes {
        id publicationStartDateAndTime title synopsis duration url
        audios {
          url downloadUrl
        }
        image {
          url description
        }
      }
    }
  }
}
`.trim();

        let response = await this.postAsync("?", this.buildQueryBody(null, q, null));
        //--transform to respond the same as above
        response = {
            data: {
                programSet: response.data.query
            }
        };

        //filter episodes without audio
        response.data.programSet.items.nodes = response.data.programSet.items.nodes.filter(p => p.audios.length > 0);

        await files.mkdirRecursiveAsync(`${this.config.path}`);
        await files.writeJsonAsync(`${this.config.path}/${this.config.name}-0-programset.json`, response);
    }

    _getTransformPodcast() {
        return `
{
    "id":id,
    "name":($split(publicationStartDateAndTime,"T")[0] & " " & title & " (" & id & ")"),
    "date":$split(publicationStartDateAndTime,"T")[0],
    "title":title,
    "synopsis":synopsis,
    "duration": duration/60,
    "weburl": url,
    "url":audios[0].url,
    "downloadUrl":audios[0].downloadUrl,
    "image":$split(image.url,"?")[0],
    "imageDescription": image.description
}        
`.trim();
    }


    async retrievePodcastDirectAsync(id) {
        let response = await this.retrieveAsync(`/items/${id}`);
        return await jsn(response, 'data.item.' + this._getTransformPodcast());
    }



    async transformProgramSetAsync() {
        let data = await files.readJsonAsync(`${this.config.path}/${this.config.name}-0-programset.json`);
        let query =
            `   
data.programSet{
"id":$.id,
"title":$.title,
"numberOfElements":$.numberOfElements,
"feedUrl":$.feedUrl,
"sharingUrl":$.sharingUrl,
"items": items.nodes.`
            + this._getTransformPodcast()
            + "}";

        data = await jsn(data, query);

        await files.writeJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`, data);


    }

    async checkWebUrls() {
        let data = await files.readJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`);

        await EnumerableExtensions.forEachAsync(data.items, async p => {
            try {
                p.weburlstatus = "";
                await this.client.getRaw(p.weburl);
                p.weburlstatus = "valid";
            }
            catch {
                p.weburlstatus = "invalid";
            }
            console.log(p.name, p.weburlstatus);
        });
        await files.writeJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`, data);
    }

    async dumpTextFiles(onlyRelativePath) {
        let data = await files.readJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`);
        //-- additionally store with synopsis
        await files.writeTextAsync(`${this.config.path}/${this.config.name}-1-podcasts.text`,
            data.items.map(p => `${p.id} ${p.name} // ${p.synopsis}`).join("\r\n"));
        //-- store urls
        let lastyear = "";
        await files.writeTextAsync(`${this.config.path}/${this.config.name}-1-podcast-urls.text`,
`
${data.title.toUpperCase()}
    ${data.sharingUrl}
    feed: ${data.feedUrl}

wenn die episode url invalid ist,
dann gibt es immer noch folgende Möglichkeit:
Öffne die offizielle Seite
https://api.ardaudiothek.de/graphiql

auf der linken Seite gibst Du folgendes ein (die id deiner episode eingeben)
und drückst oben den Go button.
Unter Umständen erhälst Du jetzt weitere Infos
wo die Musik liegt.

{ 
  query:item(id:13598589){
    id publishDate title sharingUrl summary
    audios {
      url downloadUrl
    }
  }
}

Bei den folgenden links bitte jeweils
die audiothek url voranstellen
fb verhunzt die urls, deshalb habe ich sie
nicht vollständig angegeben.
`.trim()
            + "\r\n\r\n"
            + data.items.map(p => {
                let value = "";
                let year = p.name.substring(0, 4);
                if (lastyear !== year) {
                    value = `▶ ${year}\r\n\r\n`;
                    lastyear = year;
                }
                let url = p.weburl;
                if (onlyRelativePath){
                    url = url.replace("https://www.ardaudiothek.de", "");
                }

                if ("" === p.weburlstatus || "valid" === p.weburlstatus){
                    value += `✅ ${p.name}`;
                }
                else {
                    value += `❗ ${p.name}`;
                }
                value += `\r\n${url}\r\n/episode/${p.id}`;
                if (p.weburlstatus){
                    value += `\r\nepisode url:${p.weburlstatus}`;
                }
                
                //-- fullpath
                //value += `⏩ ${p.name}\r\n${p.weburl}`;
                return value;
            }).join("\r\n\r\n"));
    }

    async downloadAllAsync(start, length) {

        let data = await files.readJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`);
        if (start && length) {
            data = data.slice(start, start + length);
        }
        else if (start) {
            data = data.slice(start);
        }
        else if (length) {
            data = data.slice(0, length);
        }
        let index = 1;
        let total = data.items.length;
        if (total > 0){
            await EnumerableExtensions.forEachAsync(data.items, async p => {
                console.log(`${index++}/${total}`, p.name);
                try {
                    await this.downloadPodcastAsync(p);
                }
                catch (e) {
                    console.error("⛔ failed to download", p.name);
                }
    
            });
        }
        else {
            console.warn("no items found");
        }
    }

    async downloadByIdAsync(id, data) {
        if (!data) {
            data = await files.readJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`);
        }
        let podcast = await jsn(data, `$[id="${id}"]`);
        await this.downloadPodcastAsync(podcast);
    }

    async downloadByDateAsync(id, data) {
        if (!data) {
            data = await files.readJsonAsync(`${this.config.path}/${this.config.name}-1-podcasts.json`);
        }
        let podcast = await jsn(data, `$[date="${id}"]`);
        await this.downloadPodcastAsync(podcast);
    }

    async downloadPodcastAsync(podcast) {
        if (podcast) {
            console.log("download", ">>", podcast.name);
            //TODO: use regex
            let name = podcast.name;
            name = name
                .replaceAll('"', '')
                .replaceAll('&', ' ')
                .replaceAll("\\", "-")
                .replaceAll("(", "")
                .replaceAll(")", "")
                .replaceAll("/", "-")
                .replaceAll(":", "")
                .replaceAll("?", "");
            console.log("download", "--", name);
            let url = podcast.downloadUrl;
            if (!url) {
                console.log("fallback to podcast.url");
                url = podcast.url;
            }
            let dir = `${this.config.path}/music/${this.config.name}`;
            let path = `${this.config.path}/music/${this.config.name} ${name}.mp3`;
            let comparePath = path;
            if (this.config.comparePath) {
                comparePath = `${this.config.comparePath}/${this.config.name} ${name}.mp3`
            }

            await files.mkdirRecursiveAsync(dir);
            if (await files.pathExistsAsync(comparePath)) {
                console.log("☒ download", "<<", podcast.name, "skipped, file exists already", path);
            }
            else {
                let content = await this.client.download(url);

                await files.writeBufferAsync(path, content);
                console.log("✅ download", "<<", podcast.name);
            }

        }
        else {
            console.log("podcast not found", id);
        }
    }

    //----

    buildQueryBody(operationName, query, variables) {
        return {
            operationName: operationName,
            query: `${query}`,
            variables: variables
        };
    }

    async retrieveAsync(query, modifyHeader) {
        return (await this.client.get(query, modifyHeader));
    }

    async postAsync(query, body, modifyHeader) {
        return (await this.client.postjson(query, body, modifyHeader));
    }
}