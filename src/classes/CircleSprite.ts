//Creates a circle sprite, which can change it's size and color based on 
//passed in audio data
export default class CircleSprite {
    maxRadius: number;
    circleRadius: number;
    fillStyle: string;
    radiusScale: number;
    //Sets the initial values for the circle
    constructor(maxRadius: number, radiusScale: number) {
        this.maxRadius = maxRadius;
        this.circleRadius = maxRadius;
        this.fillStyle = "black";
        this.radiusScale = radiusScale;
    }

    //Updates the size and color of the circle based on the passed in audio data
    update(audioData: number) {
        this.circleRadius = (audioData / 255) * this.maxRadius;
        this.fillStyle = `rgb(${audioData},${audioData - 128},${255 - audioData})`;
    }

    //Draws the circle with the new data from update
    draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, canvasHeight / 2, this.circleRadius * this.radiusScale, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.fillStyle;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}