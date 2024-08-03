# essential-nodejs

## prolog
Initially thought to be an introduction to nodejs in the vein of Don Box' essential com or essentiell .net.

But now as Olaf Zimmermann of radioeins needs to stop his elektrobeats on radioeins I felt to start with the downloads of his podcasts from the ARD Audiothek.

So I've been in hurry, because its so sad.

Further documentation will follow but we start with the downloads without any explanation at the moment.

the essentials will follow.

For now I stripped down all the dependencies to the minimum.

THe sources are in the source folder and you will need to run npm install for the dependencies there.

## essentials
no thin so far, they will be added soon...

## ard audiothek

### usage
got to the src/apps/ard-audiothek folder

- if you want to download a specific episode then navigate to that
  - e.g. https://www.ardaudiothek.de/episode/elektro-beats/boris-blank-zu-resonance/radioeins/13163679/
  - thats an elektrobeats episode...
  - ...copy the id ...
  - type it into direct-download.bat
  - next run it in the integrated terminal
- if y ou want to download all episodes of a podcast
  - navigate...
  - e.g. https://www.ardaudiothek.de/sendung/elektro-beats/87086250/
  - copy the id
  - make a copy of p-elektrobeats.js and put in the id, change the name accoordingly
  - run the node script using node <script.js> in the integrated terminal

  Hope it works for you, more documentation follows.

  At the moment...

  node p-elektrobeats.js should download all elektrobeats episodes available.

