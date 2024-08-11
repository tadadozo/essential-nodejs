import { ProcessArguments } from "../../../libs/core/ProcessArguments.js";
import { ArdAudiothek } from "../base/ArdAudiothek.js";

let args = ProcessArguments.create();

let settings = {
    id: "",
    name: args.map.name,
    path: "./localdata"
    //comparePath: "../../../../../../dat/music/rbb/musik/r1-elektrobeats"
};

if (!settings.name) {
    throw `ArgumentException: name`;
}
if (!args.map.id){
    throw `ArgumentException: id`;
}

let m = new ArdAudiothek(settings);
await m.initAsync();
//console.log(args.map.id);
let podcast = await m.retrievePodcastDirectAsync(args.map.id);
//console.log(podcast);
await m.downloadPodcastAsync(podcast);