//Creates a bar sprite, which can change it's size and color based on 
//passed in audio data
export default class BarSprite {
    barWidth: number;
    maxBarHeight: number;
    padding: number;
    fillStyle: string;
    percent: number;
    //Sets the initial values for the bar
    constructor(barWidth: number, maxBarHeight: number, padding: number) {
        this.barWidth = barWidth;
        this.maxBarHeight = maxBarHeight;
        this.padding = padding;
        this.fillStyle = "black";
        this.percent = 0;
    }

    //Updates the size and color of the bar based on the passed in audio data
    update(audioData: number) {
        this.percent = audioData / 255;
        this.percent = this.percent < 0.2 ? .02 : this.percent; //sets a minimum percent size, so bars are always visible
        this.fillStyle = `rgb(${audioData},${audioData - 128},${255 - audioData})`;
    }

    //Draws the bar with the new data from update
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.scale(1, -1);
        ctx.fillStyle = this.fillStyle;
        ctx.fillRect(0, 0, this.barWidth, this.maxBarHeight * this.percent);
        ctx.restore();
    }
}