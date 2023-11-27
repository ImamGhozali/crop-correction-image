import React, { useRef, useEffect } from 'react'
import * as d3 from "d3";
// Add this line at the top of your trimming/index.js file
const solve = require('../../pages/_numeric-solve.min.js');
import styles from './Trimming.module.css';
import cv from "@techstark/opencv-js"

// Your code here
// Call the solve function with appropriate arguments
const style = {
    display: 'block',
    width: '100%',
}

const styleDiv = {
    width: '480px',
    position: 'relative',

}

const styleButton = {
    position: 'absolute',
    left: '10px',
    marginTop: '10px',
}

const styleButton2 = {
    position: 'absolute',
    left: '100px',
    marginTop: '10px',
}
const styleButton3 = {
    position: 'absolute',
    left: '200px',
    marginTop: '10px',
}

const attachCropBox = function (imgWidth, imgHeight) {

    console.log('image loaded : ', imgWidth, ' ', imgHeight);
    var margin = { top: 40, right: 20, bottom: 20, left: 40 },
        width = imgWidth - margin.left - margin.right,
        height = imgHeight - margin.top - margin.bottom;

    var sourcePoints = [[0, 0], [width, 0], [width, height], [0, height]],
        targetPoints = [[0, 0], [width, 0], [width, height], [0, height]];

    var svg = d3.select("#background").append("svg")
        .attr("class", styles.svgLocal)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("id", "window_g");
    console.log('svg ', svg)
    var line = svg.selectAll(".line")
        .data(d3.range(0, width + 1, 40).map(function (x) {
            return [[x, 0], [x, height]];
        })
            .concat(d3.range(0, height + 1, 40).map(function (y) {
                return [[0, y], [width, y]];
            })))
        .enter().append("path")
        .attr("class", styles.line + " line--x");
    console.log('line ', line)
    var handle = svg.selectAll(".handle")
        .data(targetPoints)
        .enter().append("circle")
        .attr("class", "handle")
        .attr("transform", function (d) {
            return "translate(" + d + ")";
        })
        .attr("r", 7)
        .call(d3.behavior.drag()
            .origin(function (d) {
                return { x: d[0], y: d[1] };
            })
            .on("drag", dragged));

    d3.selectAll("button")
        .datum(function (d) {
            return JSON.parse(this.getAttribute("data-targets"));
        })
        .on("click", clicked)
        .call(transformed);

    function clicked(d) {
        d3.transition()
            .duration(750)
            .tween("points", function () {
                if (!(d == null)) {
                    var i = d3.interpolate(targetPoints, d);
                    return function (t) {
                        handle.data(targetPoints = i(t)).attr("transform", function (d) {
                            return "translate(" + d + ")";
                        });
                        transformed();
                    };
                }
            });
    }

    function dragged(d) {
        console.log('d3 event', d3.event.x + " " + d3.event.y)
        d3.select(this).attr("transform", "translate(" + (d[0] = d3.event.x) + "," + (d[1] = d3.event.y) + ")");
        transformed();
    }

    function transformed() {
        for (var a = [], b = [], i = 0, n = sourcePoints.length; i < n; ++i) {
            var s = sourcePoints[i], t = targetPoints[i];
            a.push([s[0], s[1], 1, 0, 0, 0, -s[0] * t[0], -s[1] * t[0]]), b.push(t[0]);
            a.push([0, 0, 0, s[0], s[1], 1, -s[0] * t[1], -s[1] * t[1]]), b.push(t[1]);
        }

        var X = solve(a, b, true), matrix = [
            X[0], X[3], 0, X[6],
            X[1], X[4], 0, X[7],
            0, 0, 1, 0,
            X[2], X[5], 0, 1
        ].map(function (x) {
            return d3.round(x, 6);
        });

        line.attr("d", function (d) {
            console.log('d ', d[0])
            return "M" + project(matrix, d[0]) + "L" + project(matrix, d[1]);
        });
    }
    function project(matrix, point) {
        point = multiply(matrix, [point[0], point[1], 0, 1]);
        console.log('point ', point);
        return [point[0] / point[3], point[1] / point[3]];
    }

    function multiply(matrix, vector) {
        return [
            matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2] + matrix[12] * vector[3],
            matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2] + matrix[13] * vector[3],
            matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14] * vector[3],
            matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15] * vector[3]
        ];
    }
};

const loadImageToCanvas = function (url, cavansId) {

    let canvas = document.getElementById(cavansId);
    let ctx = canvas.getContext('2d');
    let img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {

        canvas.width = img.width;
        canvas.height = img.height;
        console.log('img.height : ' + img.width + ' img.width : ' + img.height);

        ctx.drawImage(img, 0, 0, img.width, img.height);
    };
    img.src = url;
    console.log("image to canvas : ", img.src);
};

const applyTrimming = (e) => {
    e.preventDefault()

    const imageUsed = document.getElementById('sample').getAttribute('src')
    console.log('image used : ', imageUsed);
    console.log('apply trimming')
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
    loadImageToCanvas(imageUsed, 'imageInit');
    setTimeout(() => {
        let src = cv.imread('imageInit');
        console.log('src : ', src);
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

        const scaleFactor = imageWidth / (imageWidth * ratio);

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
}

const download = (e) => {
    e.preventDefault()
    console.log('download')

    let canvas = document.getElementById('imageResult1');

    let canvasWidth, canvasHeight;
    let tempW = parseInt(canvas.style.width.replace("px", ""));
    let tempH = parseInt(canvas.style.height.replace("px", ""));

    console.log("canvas ", canvas.width, canvas.height)
    console.log("tempCanvas ", tempW, tempH)
    //
    if (tempW > tempH) {
        // Landscape
        const targetRatio = 4 / 3;
        if (tempW / tempH > targetRatio) {
            canvasWidth = tempH * targetRatio;
            canvasHeight = tempH;
        } else {
            canvasWidth = tempW;
            canvasHeight = tempW / targetRatio;
        }
    } else {
        // Portrait
        const targetRatio = 3 / 4;
        if (tempW / tempH > targetRatio) {
            canvasWidth = tempH * targetRatio;
            canvasHeight = tempH;
        } else {
            canvasWidth = tempW;
            canvasHeight = tempW / targetRatio;
        }
    }

    // Create copy and adjust new width and height
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    let tempCtx = tempCanvas.getContext("2d");
    console.log('tempCanvas ', tempCanvas.width, ' ', tempCanvas.height)
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    // Generate download url
    const download = tempCanvas.toDataURL('image/jpg');
    console.log("base 64", download)

}

const Trimming = () => {
    const canvasRef = useRef(null)

    const loadGrid = (e) => {
        e.preventDefault()
        console.log('load grid')
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let img = new Image()
        var imageSrc = document.getElementById('im').src;

        var request = new XMLHttpRequest();
        request.open('GET', imageSrc, true);
        request.responseType = 'blob';
        request.onload = function () {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(request.response);
            fileReader.onload = function (e) {
                //            console.log('DataURL:', e.target.result);
                img.src = fileReader.result;
                var im = document.createElement("img");
                im.src = fileReader.result;
                im.id = "sample";
                var imageDiv = document.getElementById("background");
                imageDiv.appendChild(im); // add element img 
                document.getElementById('sample').style.display = "none";
                document.getElementById('im').style.display = 'none'
                img.onload = function () {

                    if (im.width > 540) {
                        if (im.width > im.height) {
                            canvas.width = 560;
                            canvas.height = 450;
                        } else {
                            canvas.width = 540;
                            canvas.height = 720;
                        }
                    } else {
                        canvas.width = im.width;
                        canvas.height = im.height;
                    }


                    //calc ratio
                    var hRatio = canvas.width / img.width;
                    var vRatio = canvas.height / img.height;

                    var ratio = Math.min(hRatio, vRatio);

                    //draw the image 
                    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);

                    attachCropBox(img.width * ratio, img.height * ratio);


                };
            };
        };
        request.send();

    }

    return (
        <div>
            <h1>Trimming</h1>

            <div style={{ display: 'flex' }}>
                <div style={styleDiv} id="background">
                    <img id='im' style={style} src="https://dev-api.jhia.academy/api/file/imagenotoken/type/review_image_member/filename/20230508-130228-37.jpg" alt="Trimming" />
                    <canvas ref={canvasRef} />
                    <button style={styleButton} onClick={(e) => loadGrid(e)}>load grid</button>
                    <button style={styleButton2} onClick={(e) => applyTrimming(e)}>trimming</button>
                    <button style={styleButton3} onClick={(e) => download(e)}>download</button>
                </div>
                <div style={styleDiv} id="background">
                    <canvas id="imageInit"></canvas>
                    <canvas id="imageResult"></canvas>
                    <canvas id="imageResult1"></canvas>
                </div>

            </div>

        </div>
    )
}

export default Trimming