import React, { useRef, useEffect } from 'react'
import * as d3 from "d3";
// Add this line at the top of your trimming/index.js file
const solve = require('../../pages/_numeric-solve.min.js');
import styles from './Trimming.module.css';
// Your code here
// Call the solve function with appropriate arguments
const style = {
    display: 'block',
    width: '100%',
}

const styleDiv = {
    width: '480px',

}

const attachCropBox = function (imgWidth, imgHeight) {

    console.log('image loaded : ', imgWidth, ' ', imgHeight);
    var margin = { top: 100, right: 20, bottom: 20, left: 40 },
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

const Trimming = () => {
    const canvasRef = useRef(null)

    const loadGrid = (e) => {
        e.preventDefault()
        console.log('load grid')
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let img = new Image()
        let imageElement = document.getElementById('im');

        console.log('imgload')
        img.src = imageElement.src
        let im = document.createElement('img')
        im.src = imageElement.src
        im.id = "sample";
        let imageDiv = document.getElementById('background')
        imageDiv.appendChild(im)
        document.getElementById('sample').style.display = 'none'
        document.getElementById('im').style.display = 'none'

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

        const imgWidth = img.width
        const imgHeight = img.height

        let hRatio = canvas.width / imgWidth;
        let vRatio = canvas.height / imgHeight;

        let ratio = Math.min(hRatio, vRatio);

        ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, imgWidth * ratio, imgHeight * ratio);

        attachCropBox(imgWidth * ratio, imgHeight * ratio)

    }

    return (
        <div>
            <h1>Trimming</h1>

            <div style={styleDiv} id="background">
                <img id='im' style={style} src="https://dev-api.jhia.academy/api/file/imagenotoken/type/review_image_member/filename/20230508-130228-37.jpg" alt="Trimming" />
                <canvas ref={canvasRef} />
                <button onClick={(e) => loadGrid(e)}>load grid</button>
            </div>

        </div>
    )
}

export default Trimming