//<![CDATA[
const utils = new Utils('errorMessage');
const canvas = document.getElementById('imgInit');
//const imageUsed = canvas.toDataURL();
const imageUsed = document.getElementById('sample').getAttribute('src');
console.log("imageUsed : ", imageUsed);
const applyButton = document.getElementById("j_idt31:apply");
//console.log("applyButton ",applyButton);
export const setUpApplyButton = function () {
    console.log("apply button ")

    //set coordinate point
    let pointsArray = [];
    const children = document.querySelectorAll('#window_g .handle');
    console.log(children);
    children.forEach(e => {
        const pos = e.getAttribute('transform');
        console.dir("pos : ", pos);
        const point = pos.replace('translate(', '').replace(')', '').split(',');
        pointsArray.push(point[0]);
        pointsArray.push(point[1]);
    });
    //console.log("points array : ", pointsArray);

    //load image and set to canvas imageInit
    utils.loadImageToCanvas(imageUsed, 'imageInit');
    setTimeout(() => {
        let src = cv.imread('imageInit');
        const imageHeight = document.getElementById('imageInit').height;
        const imageWidth = document.getElementById('imageInit').width;
        console.log('perpective h : ', imageHeight, ' perpective w : ', imageWidth);

        //crop svg
        const svgCropHeight = document.querySelector('#background svg').getAttribute('height') - 80;
        const svgCropWidth = document.querySelector('#background svg').getAttribute('width') - 80;

        //calculationn ratio
        var hRatio = (svgCropWidth + 80) / imageWidth;
        var vRatio = (svgCropHeight + 80) / imageHeight;

        var ratio = Math.min(hRatio, vRatio);
        //console.log("ratio : ", ratio , "hRatio : ", hRatio, " vRatio : ", vRatio);

        //console.log('h : ',imageHeight,' cw : ',imageWidth, ' cs : ', parseInt(imageWidth / svgCropWidth));
        //console.log('ch : ',svgCropHeight,' cw : ',svgCropWidth, ' cs : ', parseInt(imageWidth / svgCropWidth));
        //console.log('hr : ',imageHeight*ratio,' cr : ',imageWidth*ratio, ' cs : ', parseInt(imageWidth / svgCropWidth*ratio));
        const scaleFactor = imageWidth / (imageWidth * ratio);

        //debugger
        /*pointsArray = pointsArray.map( e => {
         const num = parseInt((parseInt(e) + 40)/scaleFactor);
         return num;
         });*/

        var svgWidth0 = 0;
        var svgWidth2 = 0;
        var svgHeight3 = 0;
        var svgHeight5 = 0;

        //scale factor for 3:4 -> 5.6
        pointsArray = pointsArray.map((e, index) => {
            console.log("points ", index, " : ", (((parseInt(e) * scaleFactor) + (scaleFactor * 40))));
            const num = parseInt(((parseInt(e) * scaleFactor)) + (scaleFactor * 40));
            if (index === 0) {
                svgWidth0 = num;
            } else if (index === 2) {
                svgWidth2 = num;
            } else if (index === 3) {
                svgHeight3 = num;
            } else if (index === 5) {
                svgHeight5 = num;
            }
            return num;
        });

        console.log("svg w0:", svgWidth0, " w2:", svgWidth2);
        console.log("svg h3:", svgHeight3, " h5:", svgHeight5);

        //part 3
        let dst = new cv.Mat();
        let dsize = new cv.Size(imageHeight, imageWidth);
        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, pointsArray);
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, imageHeight, 0, imageHeight, imageWidth, 0, imageWidth]);
        let M = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        document.getElementById('imageInit').style.display = "none";

        // Setup result
        const svgWidth = (svgWidth2 - svgWidth0);
        const svgHeight = (svgHeight5 - svgHeight3);

        //if width > height -> landscape means portrait
        console.log("svg : w:", svgWidth, " | h:", svgHeight);

        const cwidth = 540;
        const cheight = 720;

        const loadCanvas = function (width, height) {
            var canvas = document.getElementById("imageResult");
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            cv.imshow('imageResult', dst);
        };

        const loadCanvasHide = function (width, height) {
            var canvas = document.getElementById("imageResult1");
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            cv.imshow('imageResult1', dst);
            document.getElementById('imageResult1').style.display = "none";
        };

        if (svgWidth > svgHeight) {
            loadCanvas(cheight, cwidth);
            console.log("landscape");
        } else if (svgHeight > svgWidth) {
            loadCanvas(cwidth, cheight);
            console.log("portrait");
        } else if (svgHeight === svgWidth) {
            loadCanvas(cwidth, cwidth);
            console.log("square");
        }

        if (imageWidth > imageHeight) {
            if (svgWidth > svgHeight) {
                loadCanvasHide(imageWidth, imageHeight);
                console.log("l landscape : w:", imageWidth, " | h:", imageHeight);
            } else if (svgHeight > svgWidth) {
                loadCanvasHide(imageHeight, imageWidth);
                console.log("l portrait : w:", imageWidth, " | h:", imageHeight);
            } else if (svgHeight === svgWidth) {
                loadCanvasHide(imageWidth, imageWidth);
                console.log("l square : w:", imageWidth, " | h:", imageHeight);
            }
        } else if (imageHeight > imageWidth) {
            if (svgWidth > svgHeight) {//this only call when image portrait but crop svg is landscape
                loadCanvasHide(imageHeight, imageWidth);
                console.log("p landscape : w:", imageWidth, " | h:", imageHeight);
            } else if (svgHeight > svgWidth) {
                loadCanvasHide(imageWidth, imageHeight);
                console.log("p portrait : w:", imageWidth, " | h:", imageHeight);
            } else if (svgWidth === svgHeight) {//this only call when image portrait but crop svg is square
                loadCanvasHide(imageWidth, imageWidth);
                console.log("p square : w:", imageWidth, " | h:", imageHeight);
            }
        } else if (imageHeight === imageWidth) {
//            loadCanvasHide(imageWidth, imageWidth);
            loadCanvasHide(svgWidth, svgHeight);
        }

        src.delete();
        dst.delete();
        M.delete();
        srcTri.delete();
        dstTri.delete();
    }, 500);


};

applyButton.setAttribute('disabled', 'true');
applyButton.onclick = setUpApplyButton;
utils.loadOpenCv(() => {
    setTimeout(function () {
        applyButton.removeAttribute('disabled');
    }, 500);
});
//]]>