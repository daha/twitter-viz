// Copyright (c) 2012, David Haglund
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
//     * Redistributions of source code must retain the above
//       copyright notice, this list of conditions and the following
//       disclaimer.
//
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials
//       provided with the distribution.
//
//     * Neither the name of the copyright holder nor the names of its
//       contributors may be used to endorse or promote products
//       derived from this software without specific prior written
//       permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
// FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE.

/*globals d3 */

"use strict";
function Chart() {}

Chart.prototype.createChart = function (selector, data) {
    var max = d3.max(data, function (d) { return d.value; }),
        barWidth = 4,
        width = barWidth * 144,
        height = 250,
        x = d3.scale.linear()
            .domain([0, 144])
            .range([0, width]),
        y = d3.scale.linear()
            .domain([0, max])
            .rangeRound([0, height]),
        chart = d3.select("#tweet_lengths").append("svg")
            .attr("class", "chart")
            .attr("width", width + 50)
            .attr("height", height + 40)
            .append("g")
            .attr("transform", "translate(25,-15)");

    chart.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", function (d) { return x(d.key) - 0.5; })
        .attr("y", function (d) { return height - y(d.value) - 0.5; })
        .attr("width", barWidth)
        .attr("height", function (d) { return y(d.value); });

    chart.selectAll("line")
        .data(y.ticks(5))
        .enter().append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", function (d) { return height - y(d) - 0.5; })
        .attr("y2", function (d) { return height - y(d) - 0.5; })
        .style("stroke", "#ccc");

    chart.selectAll(".rule")
        .data(y.ticks(5))
        .enter().append("text")
        .attr("class", "rule")
        .attr("x", 0)
        .attr("y", function (d) { return height - y(d) - 0.5; })
        .attr("dx", -3)
        .attr("dy", 0)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "central")
        .text(String);

    chart.append("line")
        .attr("y1", height - 0.5)
        .attr("y2", height - 0.5)
        .attr("x1", 0)
        .attr("x2", width)
        .style("stroke", "#000");
};
