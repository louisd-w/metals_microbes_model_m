
// draw the entire plot
function drawTimePlot() {

    //hard-code time plot
    const plot = plots.time;

    // fill timeCanvas with a white background
    plot.ctx.fillStyle = "white";
    plot.ctx.fillRect(0, 0, plot.canvas.width, plot.canvas.height);

    // draw axes, ticks and labels
    resetDrawStyle(plot);
    drawAxes("t", "", plot);
}

// event listener for hovering over timeplot
function setupTimePlotHover() {

    // save plot before any lines added
    let savedTimePlot = null;
    let savedPhasePlot = null;

    timeCanvas.addEventListener("mouseenter", function () {
        savedTimePlot = plots.time.ctx.getImageData(0, 0, timeCanvas.width, timeCanvas.height);
        savedPhasePlot = plots.phase.ctx.getImageData(0, 0, phaseCanvas.width, phaseCanvas.height);
    });

    // update hover graphics as mouse moves
    timeCanvas.addEventListener("mousemove", function (event) {

        // get mouse coords
        const coords = getMouseCoordinates(event, plots.time);

        // do nothing outside the axes or before a trajectory has been drawn
        if (!coords || !savedTimePlot || !savedPhasePlot || !currentTrajectory) {
            return;
        }

        // restore the clean plots
        plots.time.ctx.putImageData(savedTimePlot, 0, 0);
        plots.phase.ctx.putImageData(savedPhasePlot, 0, 0);

        // draw vertical line
        plots.time.ctx.save();
        setDashedStyle('black', 1, [5,5], plots.time)
        plots.time.ctx.beginPath();
        plots.time.ctx.moveTo(coords.x, plots.time.topMargin);
        plots.time.ctx.lineTo(coords.x, timeCanvas.height - plots.time.bottomMargin);
        plots.time.ctx.stroke();
        resetDrawStyle(plots.time);

        // convert the cursor's position into a time
        const hoveredTime = modelX(coords.x, plots.time);
        const {t, x, y} = currentTrajectory;

        // find the trajectory point nearest to the hovered time
        const index = Math.min(Math.round((hoveredTime / plots.time.xmax) * (t.length - 1)), t.length - 1);

        // draw a dot on each curve
        plots.time.ctx.fillStyle = "black";
        for (const value of [x[index], y[index]]) {
            plots.time.ctx.beginPath();
            plots.time.ctx.arc(coords.x, canvasY(value, plots.time), 5, 0, Math.PI * 2);
            plots.time.ctx.fill();
        }

        // draw the corresponding point (x, y) on the phase trajectory
        plots.phase.ctx.fillStyle = "black";
        plots.phase.ctx.save();
        plots.phase.ctx.beginPath();
        plots.phase.ctx.arc(  canvasX(x[index], plots.phase), canvasY(y[index], plots.phase), 5, 0, Math.PI * 2);
        plots.phase.ctx.fill();
        plots.phase.ctx.restore();

        // make box showing time value
        const timeLabel = `t = ${hoveredTime.toFixed(2)}`;
        const boxHeight = 35;
        const boxPadding = 10;
        const lineGap = 10;
        plots.time.ctx.font = "14px Helvetica, sans-serif";
        const boxWidth = plots.time.ctx.measureText(timeLabel).width + 2 * boxPadding;

        // put box to the left of the line, keeping it inside the plot
        const boxX = Math.max(plots.time.leftMargin,  coords.x - lineGap - boxWidth);
        const boxY = plots.time.plotHeight - 25 ;

        // draw box
        plots.time.ctx.fillStyle = "white";
        plots.time.ctx.beginPath();
        plots.time.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        plots.time.ctx.fill();
        plots.time.ctx.stroke();

        // draw text
        plots.time.ctx.fillStyle = "black";
        plots.time.ctx.textAlign = "center";
        plots.time.ctx.textBaseline = "middle";
        plots.time.ctx.fillText(timeLabel, boxX + boxWidth / 2, boxY + boxHeight / 2);
        plots.time.ctx.restore();

        // redraw legend above hover line and dots
        drawLegend("C", "M", plots.time);
    });

    // remove hover graphics when mouse leaves the plot
    timeCanvas.addEventListener("mouseleave", function () {
        if (savedTimePlot) {
            plots.time.ctx.putImageData(savedTimePlot, 0, 0);
        }
        if (savedPhasePlot) {
            plots.phase.ctx.putImageData(savedPhasePlot, 0, 0);
        }
    });
}
