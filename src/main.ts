/*
    main.js is primarily responsible for hooking up the UI to the rest of the application 
    and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils';
import * as audio from './audio';
import * as canvas from './canvas';
import { DrawParams } from './interfaces/drawParams.interface';

const drawParams: DrawParams = {
    useTimeDomain: false,
    rotationChange: 0.0,
    showBars: true,
    showCircles: true,
    showNoise: false,
    showInvert: false,
    showEmboss: false
};

let highshelf: boolean, lowshelf: boolean, distortion: boolean = false;
let distortionAmount: number = 20;
let fps: number = 60;

const DEFAULTS = {
    sound1: ""
};

//Calls the JSON loading function when the page loads
const init = () => loadJsonXHR();

//Loads the JSON file, which contains the title of the page song filepaths, 
//song names, and the default song
const loadJsonXHR = () => {
    const url = "./data/av-data.JSON";
    const xhr = new XMLHttpRequest();
    xhr.onload = (e) => {
        //console.log(`In onload - HTTP Status Code = ${e.target.status}`);
        let json: { filepaths: any; songnames: any; defaultsong: string; title: string; };
        try {
            const target = e.target as any;
            json = JSON.parse(target.responseText);
        }
        catch {
            console.log("JSON parsing failed")
            return;
        }

        //Sets the song names and filepaths
        let filpathsMap = json.filepaths;
        let tracksMap = json.songnames;
        let dropdown = document.querySelector("#track-select") as HTMLSelectElement;

        for (let i = 0; i < filpathsMap.length; i++) {
            //html += `<options value="${filpathsMap[i]}">${tracksMap[i]}</option`;
            let option = document.createElement("option");
            option.text = tracksMap[i];
            option.value = filpathsMap[i];
            dropdown.add(option);
        }

        // I tried to convert the normal HTML Dropdown menu to a Bulma one, but ran into too many
        // issues, so scrapped it. 
        
        // //Sets the song names and filepaths
        // let filpathsMap = json.filepaths;
        // let tracksMap = json.songnames;
        // let dropdown = document.querySelector(".dropdown-content") as HTMLSelectElement;

        // for (let i = 0; i < filpathsMap.length; i++) {
        //     let option = document.createElement("a") as HTMLAnchorElement;
        //     option.textContent = tracksMap[i];
        //     option.href = filpathsMap[i];
        //     option.classList.add("dropdown-item");
        //     dropdown.appendChild(option);
        // }

        //Loads the default song, and the title of the webpage from the JSON file
        DEFAULTS.sound1 = json.defaultsong;
        document.title = json.title;
        document.querySelector("h1").innerHTML = json.title;

        //Sets up the audio and canvas after all of the JSON finishs loading 
        audio.setupWebaudio(DEFAULTS.sound1);
        let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
        setupUI(canvasElement);
        canvas.setupCanvas(canvasElement, audio.analyserNode);
        loop();
    };
    //xhr.onerror = e => { console.log(`In onerror - HTTP Status Code = ${e.target.status}`); };
    xhr.open("GET", url);
    xhr.send();
};

//Sets up all of the checkboxes, sliders, and file upload
const setupUI = (canvasElement: HTMLCanvasElement) => {
    // A - hookup fullscreen button
    const fsButton = document.querySelector("#btn-fs") as HTMLButtonElement;
    const playButton = document.querySelector("#btn-play") as HTMLButtonElement;

    // add .onclick event to button
    fsButton.onclick = e => {
        //console.log("goFullscreen() called");
        utils.goFullscreen(canvasElement);
    };

    playButton.onclick = e => {
        //console.log(`audioCtx.state before = ${audio.audioCtx.state}`);

        const target = e.target as HTMLInputElement;
        //check if the context is suspended (autoplay policy)
        if (audio.audioCtx.state == "suspended") {
            audio.audioCtx.resume();
        }
        //console.log(`audioCtx.state after = ${audio.audioCtx.state}`);
        if (target.dataset.playing == "no") {
            //if the track is currently paused, play it
            audio.playCurrentSound();
            target.dataset.playing = "yes"; //our CSS will set the text to "Pause"
            drawParams.rotationChange = 0.01;
        }
        else { //if the track is playing, pause it
            audio.pauseCurrentSound();
            target.dataset.playing = "no"; //our CSS will set the text to "Play"
            drawParams.rotationChange = 0.0;
        }
    }

    // Hook up volume slider and label
    let volumeSlider = document.querySelector("#volume-slider") as HTMLInputElement;
    let volumeLabel = document.querySelector("#volume-label") as HTMLLabelElement;

    //add .oninput event to slider
    volumeSlider.oninput = e => {
        //set the gain
        const target = e.target as HTMLInputElement;
        audio.setVolume(target.value);
        //update the label to match the value of the slider
        volumeLabel.innerHTML = (Math.round((((Number)(target.value)) / 2 * 100))).toString();
    };

    //set value of label to match initial value of slider
    volumeSlider.dispatchEvent(new Event("input"));

    //hookup track <select>
    let trackSelect = document.querySelector("#track-select") as HTMLInputElement;
    //add .onchange event to <select>
    trackSelect.onchange = e => {
        const target = e.target as HTMLInputElement;
        audio.loadSoundFile(target.value);
        //pause the current track if it is playing
        if (playButton.dataset.playing == "yes") {
            playButton.dispatchEvent(new MouseEvent("click"));
        }
    };

    //set up checkboxes
    (document.querySelector("#bars-cb") as HTMLInputElement).onchange = e => { const target = e.target as HTMLInputElement; drawParams.showBars = target.checked; }
    (document.querySelector("#circles-cb") as HTMLInputElement).onchange = e => { const target = e.target as HTMLInputElement; drawParams.showCircles = target.checked; }
    (document.querySelector("#noise-cb") as HTMLInputElement).onchange = e => { const target = e.target as HTMLInputElement; drawParams.showNoise = target.checked; }
    (document.querySelector("#invert-cb") as HTMLInputElement).onchange = e => { const target = e.target as HTMLInputElement; drawParams.showInvert = target.checked; }
    (document.querySelector("#emboss-cb") as HTMLInputElement).onchange = e => { const target = e.target as HTMLInputElement; drawParams.showEmboss = target.checked; }
    (document.querySelector("#domain-cb") as HTMLInputElement).onchange = e => { const target = e.target as HTMLInputElement; drawParams.useTimeDomain = target.checked; }

    // FILE UPLOAD

    (document.querySelector("#upload") as HTMLInputElement).onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        //document.querySelector("audio").src = URL.createObjectURL(files[0]);
        audio.loadSoundFile(URL.createObjectURL(files[0]));
        //pause the current track if it is playing
        if (playButton.dataset.playing == "yes") {
            playButton.dispatchEvent(new MouseEvent("click"));
        }
    };

    //SOUND NODES/FILTERS SETUP

    // I. set the initial state of the high shelf checkbox
    (document.querySelector('#cb-highshelf') as HTMLInputElement).checked = highshelf; // `highshelf` is a boolean we will declare in a second

    // II. change the value of `highshelf` every time the high shelf checkbox changes state
    (document.querySelector('#cb-highshelf') as HTMLInputElement).onchange = e => {
        const target = e.target as HTMLInputElement;
        highshelf = target.checked;
        audio.toggleHighshelf(highshelf); // turn on or turn off the filter, depending on the value of `highshelf`!
    };

    // III. when the app starts up, turn on or turn off the filter, depending on the value of `highshelf`!
    audio.toggleHighshelf(highshelf);

    // IV. set the initial state of the low shelf checkbox
    (document.querySelector('#cb-lowshelf') as HTMLInputElement).checked = lowshelf; // `highshelf` is a boolean we will declare in a second

    // V. change the value of `lowshelf` every time the low shelf checkbox changes state
    (document.querySelector('#cb-lowshelf') as HTMLInputElement).onchange = e => {
        const target = e.target as HTMLInputElement;
        lowshelf = target.checked;
        audio.toggleLowshelf(lowshelf); // turn on or turn off the filter, depending on the value of `highshelf`!
    };

    // VI. when the app starts up, turn on or turn off the filter, depending on the value of `lowshelf`!
    audio.toggleLowshelf(lowshelf);

    // VII. set up distortion event listener for checkbox
    (document.querySelector('#cb-distortion') as HTMLInputElement).onchange = e => {
        const target = e.target as HTMLInputElement;
        distortion = target.checked;
        audio.toggleDistortion(distortion, distortionAmount); // turn on or turn off the filter, depending on the value of `highshelf`!
    };

    // VIII. set up distortion slider and amount

    let distortionLabel = document.querySelector("#distortion-label") as HTMLLabelElement;

    (document.querySelector('#slider-distortion') as HTMLInputElement).value = distortionAmount.toString();
    (document.querySelector('#slider-distortion') as HTMLInputElement).oninput = e => {
        const target = e.target as HTMLInputElement;
        distortionAmount = Number(target.value);
        audio.toggleDistortion(distortion, distortionAmount);
        distortionLabel.innerHTML = (Math.round((Number(target.value) / 2 * 100))).toString();
    };

    //set value of label to match initial value of slider
    document.querySelector('#slider-distortion').dispatchEvent(new Event("input"));

    audio.toggleDistortion(distortion, distortionAmount);
}; // end setupUI

//Starts the loop for drawing on the canvas
const loop = () => {
    setTimeout(loop, 1000 / fps);
    canvas.draw(drawParams);
};

export { init };