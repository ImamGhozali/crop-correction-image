//<![CDATA[
const attachCropBox = function (imgWidth, imgHeight) {

    console.log('image loaded : ', imgWidth, ' ', imgHeight);
    var margin = {top: 40, right: 40, bottom: 40, left: 40},
            width = imgWidth - margin.left - margin.right,
            height = imgHeight - margin.top - margin.bottom;

    var sourcePoints = [[0, 0], [width, 0], [width, height], [0, height]],
            targetPoints = [[0, 0], [width, 0], [width, height], [0, height]];

    var svg = d3.select("#background").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("id", "window_g");

    var line = svg.selectAll(".line")
            .data(d3.range(0, width + 1, 40).map(function (x) {
                return [[x, 0], [x, height]];
            })
                    .concat(d3.range(0, height + 1, 40).map(function (y) {
                        return [[0, y], [width, y]];
                    })))
            .enter().append("path")
            .attr("class", "line line--x");

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
                        return {x: d[0], y: d[1]};
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
            return "M" + project(matrix, d[0]) + "L" + project(matrix, d[1]);
        });
    }
    function project(matrix, point) {
        point = multiply(matrix, [point[0], point[1], 0, 1]);
        return [point[0] / point[3], point[1] / point[3]];
    }

    function multiply(matrix, vector) {
        return [
            matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8 ] * vector[2] + matrix[12] * vector[3],
            matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9 ] * vector[2] + matrix[13] * vector[3],
            matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14] * vector[3],
            matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15] * vector[3]
        ];
    }
};
var rot = 90;


//document.getElementById('j_idt30:imageRotate').addEventListener('click', function (e) {
//    let downloadLink = document.createElement('a');
//    downloadLink.setAttribute('download', 'CanvasAsImage.jpg');
//
//    let tempCanvas = document.createElement("canvas");
//    console.log("canvas1.style ", canvas1.width)
//    tempCanvas.width = parseInt(canvas1.style.width.replace("px", ""));
//    tempCanvas.height = parseInt(canvas1.style.height.replace("px", ""));
//    let tempCtx = tempCanvas.getContext("2d");
//    tempCtx.drawImage(canvas1, 0, 0, canvas1.width, tempCanvas.height);
//
//    // Generate download url
//    const download = tempCanvas.toDataURL('image/jpg');
//    console.log("download ", download)
//    downloadLink.setAttribute('href', download);
//    downloadLink.click();
//    let canvas = document.getElementById("imgInit");
//    //console.log("canvas ",canvas);
//    let ctx = canvas.getContext('2d');
//    var img = new Image();
//
//    var imageSrc = document.getElementById('image').src;
////    console.log("imageSrc ", imageSrc);
////    const imageBase64 = URL.createObjectURL(imageSrc)
//    var request = new XMLHttpRequest();
//    request.open('GET', imageSrc, true);
//    request.responseType = 'blob';
//    request.onload = function () {
//        var fileReader = new FileReader();
//        fileReader.readAsDataURL(request.response);
//        fileReader.onload = function (e) {
////            console.log('DataURL:', e.target.result);
//            img.src = fileReader.result;
//            var im = document.createElement("img");
//            im.src = fileReader.result;
//            im.id = "sample";
//            var imageDiv = document.getElementById("background");
//            imageDiv.appendChild(im); // add element img 
//            document.getElementById('sample').style.display = "none";
//
//            img.onload = function () {
//                //canvas width and height
//                canvas.width = 540;
//                canvas.height = 720;
//
//                //image width and height
//                const imgWidth = img.width;
//                const imgHeight = img.height;
//
//                //calc ratio
//                var hRatio = canvas.width / img.width;
//                var vRatio = canvas.height / img.height;
//
//                var ratio = Math.min(hRatio, vRatio);
//
//                //draw the image 
//                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
//                //draw image for flex
//                //ctx.drawImage(img, 0,0,img.width*ratio, img.height*ratio);
//                //crop the image
//                attachCropBox(img.width * ratio, img.height * ratio);
//
//                //load perspective js after image load
//                var tag = document.createElement("script");
//                tag.src = "../../../resources/js/perspective.js";
//                document.getElementsByTagName("body")[0].appendChild(tag);
//            };
//        };
//    };
//    request.send();
//});

window.onload = function () {

    var canvas = document.getElementById("imgInit");
    var ctx = canvas.getContext("2d");
    var img = document.getElementById("im");
    console.log("img width ", img.width);
    if (img.width > 540) {
        if (img.width > img.height) {
            canvas.width = 560;
            canvas.height = 450;
        } else {
            canvas.width = 540;
            canvas.height = 720;
        }
    } else {
        canvas.width = img.width;
        canvas.height = img.height;
    }

    console.log("canvas1.style ", canvas.width)
//    ctx1.drawImage(img, 0, 0, canvas1.width, canvas1.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

document.getElementById('j_idt31:load_grid').addEventListener('click', function (e) {
    let canvas = document.getElementById("imgInit");
    //console.log("canvas ",canvas);
    let ctx = canvas.getContext('2d');
    var img = new Image()
    var imageSrc = document.getElementById('im').src;
    var im = document.getElementById("im");

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

            img.onload = function () {
                //canvas width and height
//                canvas.width = 540;
//                canvas.height = 720;
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

                //image width and height
                const imgWidth = img.width;
                const imgHeight = img.height;

                //calc ratio
                var hRatio = canvas.width / img.width;
                var vRatio = canvas.height / img.height;

                var ratio = Math.min(hRatio, vRatio);

                //draw the image 
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
                //draw image for flex
                //ctx.drawImage(img, 0,0,img.width*ratio, img.height*ratio);
                //crop the image
                attachCropBox(img.width * ratio, img.height * ratio);

                //load perspective js after image load
                var tag = document.createElement("script");
                tag.src = "../../../resources/js/perspective.js";
                document.getElementsByTagName("body")[0].appendChild(tag);
            };
        };
    };
    request.send();
});
//]]>