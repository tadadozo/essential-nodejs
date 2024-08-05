import { ArdAudiothek } from "./base/ArdAudiothek.js";

/*
the download of all episode on
https://www.ardaudiothek.de/sendung/elektro-beats/87086250/

*/

//TODO:
// specify the id and your prefix for the podcast
let settings = {
    id: "13552191",
    name: "s24-eatit",
    path: "./localdata",
};

let m = new ArdAudiothek(settings);
await m.initAsync();

await m.retrieveProgramSetAsync();
await m.transformProgramSetAsync();
let start = null; //indicates where to start the episode with index 0..n, if start is null we start with index 0 (the first one)
let length = 5; //the number of episodes starting at start, if length is null then all are download starting at start
//you could also call the following to download all as well
//await m.downloadAllAsync();

await m.downloadAllAsync(start,length);