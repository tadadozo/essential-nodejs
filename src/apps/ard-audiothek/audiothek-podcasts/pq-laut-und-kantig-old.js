import { ArdAudiothek } from "../base/ArdAudiothek.js";

/*
the download of all episodes on
https://www.ardaudiothek.de/sendung/laut-und-kantig/10361305/

*/

//TODO:
// specify the id and your prefix for the podcast
let settings = {
    id: "10361305",
    name: "lk-old",
    path: "./localdata"
    //comparePath: "../../../../../../dat/music/rbb/musik/r1-elektrobeats"
};

let m = new ArdAudiothek(settings);
await m.initAsync();

let start = 120; //indicates where to start the episode with index 0..n, if start is null we start with index 0 (the first one)
let length = null; //the number of episodes starting at start, if length is null then all are download starting at start

//retrieve data using the post query option for paging

// await m.retrieveProgramSetWithQueryAsync(start,length);
// await m.transformProgramSetAsync();
// await m.checkWebUrls();
// let onlyRelativePath = true;
// await m.dumpTextFiles(onlyRelativePath);
await m.downloadAllAsync();