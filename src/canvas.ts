/*
    The purpose of this file is to take in the analyser node and a <canvas> element: 
      - the module will create a drawing context that points at the <canvas> 
      - it will store the reference to the analyser node
      - in draw(), it will loop through the data in the analyser node
      - and then draw something representative on the canvas
      - maybe a better name for this file/module would be *visualizer.js* ?
*/

//import * as utils from './utils.js';
import CircleSprite from './classes/CircleSprite';
import BarSprite from './classes/BarSprite';
import { DrawParams } from './interfaces/drawParams.interface';

let ctx:CanvasRenderingContext2D, canvasWidth:number, canvasHeight:number, analyserNode:AnalyserNode, audioData: Uint8Array, vinyl: HTMLImageElement;
let vinylRotation:number = 1;

let circleSprites:CircleSprite[];
let barSprite:BarSprite;

//Sets up the canvas, loads the record image, and creates the two sprites
const setupCanvas = (canvasElement: HTMLCanvasElement, analyserNodeRef: AnalyserNode) => {
    // create drawing context
    ctx = canvasElement.getContext("2d");
    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;
    // keep a reference to the analyser node
    analyserNode = analyserNodeRef;
    // this is the array where the analyser data will be stored
    audioData = new Uint8Array(analyserNode.fftSize / 2);

    //load record image
    vinyl = new Image();
    vinyl.src = "./media/vinyl.jpg";

    circleSprites = [];

    //The two sprites are handled differently. The Circles have three distinct
    //sprites that each get updated, while the Bar only has one sprite that 
    //gets passed in new information and draw multiple times each time the 
    //draw method below gets called, as it didn't make sense to create a bunch of
    //copies of the bar sprites, each just rotated a tiny bit. 

    //Create circle sprites
    circleSprites.push(new CircleSprite(canvasHeight / 4, 0.75));
    circleSprites.push(new CircleSprite(canvasHeight / 4, 0.50));
    circleSprites.push(new CircleSprite(canvasHeight / 4, 0.25));

    //Create bar sprite
    barSprite = new BarSprite(15, 110, 2);
};

//Draws the circles and bars using the audio data from the analyzer node, as well as
//rotating the record image. 
const draw = (params:DrawParams) => {
    // 1 - populate the audioData array with the frequency data from the analyserNode
    // notice these arrays are passed "by reference" 
    if (params.useTimeDomain) {
        analyserNode.getByteTimeDomainData(audioData); // waveform data
    }
    else {
        analyserNode.getByteFrequencyData(audioData);
    }

    // 2 - draw background
    ctx.save();
    ctx.fillStyle = "#eef6fc";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate(vinylRotation);
    ctx.scale(0.5, 0.5);
    ctx.drawImage(vinyl, -vinyl.width / 2, -vinyl.height / 2);
    ctx.restore();

    //Checks to see if the song is done or paused. If it is, it stops the record vinyl from rotating
    if (calculateMean(audioData) > 1.0) {
        vinylRotation += params.rotationChange;
    }

    // 3 - draw bars
    if (params.showBars) {

        ctx.save();

        ctx.translate(canvasWidth / 2 - barSprite.barWidth / 2, canvasHeight / 2 - 77);

        for (let i = 0; i < audioData.length; i++) {
            ctx.translate(barSprite.barWidth, 0);
            ctx.rotate(Math.PI * 2 / 32);
            barSprite.update(audioData[i]);
            barSprite.draw(ctx);
        }
        ctx.restore();
    }

    // 4 - draw circles
    if (params.showCircles) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < audioData.length; i++) {
            for (let j = 0; j < circleSprites.length; j++) {
                circleSprites[j].update(audioData[i]);
                circleSprites[j].draw(ctx, canvasWidth, canvasHeight);
            }
        }
        ctx.restore();
    }

    // 5 - bitmap manipulation
    let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width; // not using here
    // B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for (let i = 0; i < length; i += 4) {
        // C) randomly change every 20th pixel to green
        if (params.showNoise && Math.random() < 0.05) {
            // data[i] is the red channel
            // data[i+1] is the green channel
            // data[i+2] is the blue channel
            // data[i+3] is the alpha channel
            // zero out the red and green and blue channels
            // make the red channel 100% red
            data[i] = data[i + 1] = data[i + 2] = 0;
            data[i + 1] = 255;
        } // end if

        //invert colors
        if (params.showInvert) {
            let red = data[i], green = data[i + 1], blue = data[i + 3];
            data[i] = 255 - red; //set red
            data[i + 1] = 255 - green; //set green
            data[i + 2] = 255 - blue; //set blue
            //data[i+3] is the alpha, but we are leaving that alone
        }
    } // end for

    //emboss
    //note: we are stepping through *each* sub-pixel
    if (params.showEmboss) {
        for (let i = 0; i < length; i++) {
            if (i % 4 == 3) continue; //skips alpha channel
            data[i] = 127 + 2 * data[i] - data[i + 4] - data[i + width * 4];
        }
    }

    // D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);
};

//Calculates the mean of all of the audioData frequencies, in order
//to see if the song is playing or not (if the mean is close to 0, the
//song is likely ending or has ended/has been paused)
const calculateMean = (audioData: Uint8Array) => {
    let total = 0;
    for (let i = 0; i < audioData.length; i++) {
        total += audioData[i];
    }
    return total / audioData.length;
}

export { setupCanvas, draw };