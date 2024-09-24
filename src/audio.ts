// 1 - our WebAudio context, **we will export and make this public at the bottom of the file**
let audioCtx:AudioContext;

// **These are "private" properties - these will NOT be visible outside of this module (i.e. file)**
// 2 - WebAudio nodes that are part of our WebAudio audio routing graph
let element:HTMLAudioElement, sourceNode: MediaElementAudioSourceNode, analyserNode: AnalyserNode, gainNode: GainNode, highShelfBiquadFilter: BiquadFilterNode, lowShelfBiquadFilter: BiquadFilterNode, distortionFilter: WaveShaperNode;

// 3 - here we are faking an enumeration
import {defaults} from './enums/audio-defaults.enum';

// 4 - create a new array of 8-bit integers (0-255)
// this is a typed array to hold the audio frequency data

// **Next are "public" methods - we are going to export all of these at the bottom of this file**
const setupWebaudio = (filePath: string) => {
    // 1 - The || is because WebAudio has not been standardized across browsers yet
    const AudioContext = window.AudioContext;
    audioCtx = new AudioContext();

    // 2 - this creates an <audio> element
    element = new Audio();

    // 3 - have it point at a sound file
    loadSoundFile(filePath);

    // 4 - create an a source node that points at the <audio> element
    sourceNode = audioCtx.createMediaElementSource(element);

    // 5 - create an analyser node
    analyserNode = audioCtx.createAnalyser(); // note the UK spelling of "Analyser"

    /*
    // 6
    We will request DEFAULTS.numSamples number of samples or "bins" spaced equally 
    across the sound spectrum.

    If DEFAULTS.numSamples (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
    the third is 344Hz, and so on. Each bin contains a number between 0-255 representing 
    the amplitude of that frequency.
    */

    // fft stands for Fast Fourier Transform
    analyserNode.fftSize = defaults.numSamples;

    // 7 - create a gain (volume) node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = defaults.gain;

    // 8 - create the treble node
    highShelfBiquadFilter = audioCtx.createBiquadFilter();
    highShelfBiquadFilter.type = "highshelf";

    // 9 - create the bass node
    lowShelfBiquadFilter = audioCtx.createBiquadFilter();
    lowShelfBiquadFilter.type = "lowshelf";

    // 10 - create the distortion node
    distortionFilter = audioCtx.createWaveShaper();

    // 11 - connect the nodes - we now have an audio graph
    sourceNode.connect(analyserNode);
    analyserNode.connect(gainNode);
    gainNode.connect(highShelfBiquadFilter);
    highShelfBiquadFilter.connect(lowShelfBiquadFilter);
    lowShelfBiquadFilter.connect(distortionFilter);
    distortionFilter.connect(audioCtx.destination);
};

//Loads a sound file from the provided filepath
const loadSoundFile = (filePath: string) => element.src = filePath;

//Plays the current sound
const playCurrentSound = () => element.play();

//Pauses the current sound
const pauseCurrentSound = () => element.pause();

//Changes the volume based on the volume slider using the gain node
const setVolume = (value: string | number) => {
    value = Number(value); // make sure that it's a Number rather than a String
    gainNode.gain.value = value;
};

//Uses the highShelfBiquadFilter to create a Treble Filter
const toggleHighshelf = (highshelf: boolean) => { //treble
    if (highshelf) {
        highShelfBiquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        highShelfBiquadFilter.gain.setValueAtTime(25, audioCtx.currentTime);
    } else {
        highShelfBiquadFilter.gain.setValueAtTime(0, audioCtx.currentTime);
    }
};

//Uses the lowShelfBiquadFilter to create a Bass Filter
const toggleLowshelf = (lowshelf: boolean) => { //bass
    if (lowshelf) {
        lowShelfBiquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        lowShelfBiquadFilter.gain.setValueAtTime(15, audioCtx.currentTime);
    } else {
        lowShelfBiquadFilter.gain.setValueAtTime(0, audioCtx.currentTime);
    }
};

//Adds distortion to the audio via a distortion curve
const toggleDistortion = (distortion: boolean, distortionAmount: number) => {
    if (distortion) {
        distortionFilter.curve = null; // being paranoid and trying to trigger garbage collection
        distortionFilter.curve = makeDistortionCurve(distortionAmount);
    } else {
        distortionFilter.curve = null;
    }
};

//Creates a distortion curve using a distortion formula
//from: https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
const makeDistortionCurve = (amount: number = 20) => {
    if (amount == 0) return;
    let n_samples = 256, curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        let x = i * 2 / n_samples - 1;
        //curve[i] = -(Math.PI + 100 * x/2) / (Math.PI + 50 * Math.abs(x)) * amount;
        //curve[i] = (Math.PI + (amount * 2)) * x / (Math.PI + amount * Math.abs(x));
        curve[i] = (Math.PI + 100 * x / 2) / (Math.PI + 100 * Math.abs(x) * amount);
        //curve[i] = x * Math.sin(x) * amount/5;
        //curve[i] = (x * 5 + Math.random() * 2 - 1);
    }
    return curve;
};

export { audioCtx, setupWebaudio, playCurrentSound, pauseCurrentSound, loadSoundFile, setVolume, analyserNode, toggleHighshelf, toggleLowshelf, toggleDistortion };