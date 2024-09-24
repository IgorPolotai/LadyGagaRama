import * as main from "./main";

//Starts the init() function when the window loads
//Loading of the image is done in canvas.js,
//since it made sense to put it there
window.onload = () => {
    //console.log("window.onload called");
    // 1 - do preload here - load fonts, images, additional sounds, etc...

    // 2 - start up app
    main.init();
}