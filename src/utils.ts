//Creates a color based on the passed in rgba values
const makeColor = (red: number, green: number, blue: number, alpha: number = 1) => {
    return `rgba(${red},${green},${blue},${alpha})`;
};

//Generates a random number between the min and max
const getRandom = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

//Generates a random color 
const getRandomColor = () => {
    const floor: number = 35; // so that colors are not too bright or too dark 
    const getByte = () => getRandom(floor, 255 - floor);
    return `rgba(${getByte()},${getByte()},${getByte()},1)`;
};

//Creates a gradient based on the passed in color and percent values
const getLinearGradient = (ctx:CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, colorStops: any) => {
    let lg = ctx.createLinearGradient(startX, startY, endX, endY);
    for (let stop of colorStops) {
        lg.addColorStop(stop.percent, stop.color);
    }
    return lg;
};

// https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
//Sets the canvas to full screen
const goFullscreen = (element: HTMLCanvasElement) => {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.requestFullscreen) { // camel-cased 'S' was changed to 's' in spec
        element.requestFullscreen();
    } else if (element.requestFullscreen) {
        element.requestFullscreen();
    }
    // .. and do nothing if the method is not supported
};

export { makeColor, getRandomColor, getLinearGradient, goFullscreen };