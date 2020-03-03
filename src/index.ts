import sharp from 'sharp';
import Files from './tools/Files';
import _ from './tools/Terminal';
import path from "path";

const argv = require('yargs').argv;
const { target } = argv;

const findTarget = (target: string, dir: string[]): boolean => {
    for (let fileOrFolder of dir) {
        if (fileOrFolder === target) return true;
    }
    return false;
}

let uintPixels: number[][] = [];
let sizedMatrix: number[][] = [];
let stringifiedData: string = "";

(async () => {
    try {
        if (!target) throw new Error("No target specified.");
        const dir = await Files.readDir("./");
        if (!findTarget(target, dir)) throw new Error(`Image file ${target} could not be found on current working directory.`);
        _.say(`Image file ${target} found.`);
        _.say(`Processing image...`);
        const { data, info } = await sharp(path.join(process.cwd(), target))
            .raw()
            .toBuffer({ resolveWithObject: true });
        const jsonFromBuffer = data.toJSON();
        _.say(`Image has width of ${info.width}px and height of ${info.height}px. Mapping matrix...`);

        for (let i = 0; i < info.width; i++) {
            sizedMatrix[i] = new Array(info.height);
        }

        let counter = 1;
        for (let i = 0; i < jsonFromBuffer.data.length; i++) {
            if (counter === 4) {
                uintPixels.push(jsonFromBuffer.data.slice(i - 3, i + 1));
                counter = 1;
                continue;
            }
            counter++;
        }
        let inner = 0;
        let resCounter = 0;
        for (let i = 0; i < uintPixels.length; i++) {
            if (inner < info.width) {
                (sizedMatrix[inner][resCounter] as any) = uintPixels[i];
                inner++;
            }
            else {
                resCounter++;
                inner = 0;
                (sizedMatrix[inner][resCounter] as any) = uintPixels[i];
                inner++;
            }
        }
        _.say(`Writing to file...`);
        stringifiedData = JSON.stringify({ map: sizedMatrix });
        await Files.touch("./", "map.json", stringifiedData);
    } catch (e) {
        _.say(e + " " + e.stack, "red");
        process.exit(1);
    }
})();

