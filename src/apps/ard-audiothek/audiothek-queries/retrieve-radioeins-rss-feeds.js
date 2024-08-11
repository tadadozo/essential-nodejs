import Enumerable from "linq";
import { ArdAudiothekQueryClient } from "../base/ArdAudiothekQueryClient.js";
import { files } from "../../../libs/core/files.js"
/*

//-- radioeins root page
https://www.ardaudiothek.de/radio/rbb/radioeins/

//-- request seen in the network traffic
https://programm-api.ard.de/radio/api/publisher?publisher=urn:ard:publisher:9e8b2b6352741adb
*/

//https://api.ardaudiothek.de/graphiql

//-- simplify access to first element
let first = p => {
    return Enumerable.from(p).firstOrDefault();
}

let client = new ArdAudiothekQueryClient();
await client.initAsync();

// //-- find organization
// let organization = first(await client.retrieveOrganizationsByNameAsync("RBB"));
// console.log("organization", organization);

// //-- find publication services
// let publicationServices = await client.retrievePublicationServicesByOrganizationNameAsync("RBB");
// console.log("services", publicationServices.map(p => p.title).join("|"));

//-- find publicationServices RBB, radioeins
let publicationService = first(await client.retrievePublicationServicesByServiceNameAsync("RBB", "radioeins"));
console.log("service", publicationService);

//-- find radioeins feeds using the publicationService coreId
let programSets = await client.retrieveProgramSetsByPublicationServiceCoreIdAsync(publicationService.coreId);
programSets.forEach(p => {
    p.feedStatus =
    !p.feedUrl ? "none"
    : p.feedUrl.endsWith("feed=podcast.xml") ? "valid"
    : p.feedUrl.startsWith("crid://") ? "crid"
    : "check";
});
let analysis = programSets.map(p => {
    let symbol =
    "none" === p.feedStatus ? "⛔"
    : "valid" === p.feedStatus ? "✅"
    : "crid" === p.feedStatus ? "❓"
    : "✋";

    return `${symbol} ${p.title} (${p.numberOfElements})\r\n${p.feedUrl}\r\n${p.coreId}`
}).join("\r\n");
console.log("programSets", analysis);
await files.writeTextAsync("./localdata/feeds.txt", analysis);

//-- now check the feeds

