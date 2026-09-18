// draw one arrow
function drawArrow(x, y, dx, dy) {

    //hard-code phase plot
    const plot = plots.phase;

    const arrowLength = 0.5 * spacing;

    // centre arrow on grid point
    const x1 = x - 0.5 * arrowLength * dx;
    const y1 = y - 0.5 * arrowLength * dy;

    const x2 = x + 0.5 * arrowLength * dx;
    const y2 = y + 0.5 * arrowLength * dy;

    // convert to canvas coordinates
    const X1 = canvasX(x1, plot);
    const Y1 = canvasY(y1, plot);

    const X2 = canvasX(x2, plot);
    const Y2 = canvasY(y2, plot);

    // arrow shaft
    plot.ctx.beginPath();
    plot.ctx.moveTo(X1, Y1);
    plot.ctx.lineTo(X2, Y2);
    plot.ctx.stroke();

    // arrow head
    const angle = Math.atan2(Y2 - Y1, X2 - X1);
    const headLength = 5;

    plot.ctx.beginPath();

    plot.ctx.moveTo(X2, Y2); // end of shaft

    plot.ctx.lineTo(
        X2 - headLength * Math.cos(angle - Math.PI / 6),    // left side of head
        Y2 - headLength * Math.sin(angle - Math.PI / 6)
    );

    plot.ctx.moveTo(X2, Y2); // back to end of shaft

    plot.ctx.lineTo(
        X2 - headLength * Math.cos(angle + Math.PI / 6),    // right side of head
        Y2 - headLength * Math.sin(angle + Math.PI / 6)
    );

    plot.ctx.stroke();
}

// update vector field
function updateVectorFieldGrid(gridSize) {
    const dx = plots.phase.xmax / gridSize;
    const dy = plots.phase.ymax / gridSize;

    // used to determine the arrow length
    spacing = Math.min(dx, dy);

    x_vals = linspace(dx/2, plots.phase.xmax - dx/2, gridSize);
    y_vals = linspace(dy/2, plots.phase.ymax - dy/2, gridSize);
}

// draw vector field
function drawVectorField(F, G, x_vals, y_vals) {

    //hard-code phase plot
    const plot = plots.phase;

    plot.ctx.strokeStyle = "#444";
    plot.ctx.lineWidth = 1;

    for (let i = 0; i < x_vals.length; i++) {

        for (let j = 0; j < y_vals.length; j++) {

            const x = x_vals[i];
            const y = y_vals[j];

            // evaluate vector field
            let dx = F(x, y);
            let dy = G(x, y);

            // normalise
            [dx, dy] = normalise(dx, dy);

            // don't draw zero vectors
            if (dx !== 0 || dy !== 0) {
                drawArrow(x, y, dx, dy, plot);
            }
        }
    }

    plot.ctx.strokeStyle = "#444";
    plot.ctx.lineWidth = 1;
}

// draw the entire plot
function drawPhasePlot() {

    //hard-code phase plot
    const plot = plots.phase;

    // fill phaseCanvas with a white background
    plot.ctx.fillStyle = "white";
    plot.ctx.fillRect(0, 0, plot.canvas.width, plot.canvas.height);

    //draw axes, ticks and labels
    resetDrawStyle(plot);
    drawAxes("C", "M", plot);

    // draw vector field
    drawVectorField(F, G, x_vals, y_vals, plot);

    // draw nullclines
    
    // C
    setDashedStyle("blue", 4, [15, 10], plot); //[dashLength, gapLength]
    drawImplicitCurveLLM(F, 500, plot);

    // M
    setSolidStyle("red", 2, plot);
    drawImplicitCurveLLM(G, 500, plot);

    drawLegend("C nullcline", "M nullcline", plot);
}

// nuclines ----------------------------------------------------------------------------------------------------------------

//draw line between two points
function drawLine(x1, y1, x2, y2) {

    //hard-code phase plot
    const plot = plots.phase;

    plot.ctx.beginPath();
    plot.ctx.moveTo(canvasX(x1, plot), canvasY(y1, plot));
    plot.ctx.lineTo(canvasX(x2, plot), canvasY(y2, plot));
    plot.ctx.stroke();
}

// interpolate to find zero crossing on an edge
function interpolateZeroCrossing(p1, f1, p2, f2) {
    const t = f1 / (f1 - f2);
    return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
    };
}

// approximate f(x,y) = 0 using marching squares
function drawImplicitCurve(F, meshDensity = 500){

    //hard-code phase plot
    const plot = plots.phase;

    // meshDensity: number of squares along each axis

    // create a grid and return each square as four corner points
    const xGrid = linspace(0, plot.xmax, meshDensity + 1);
    const yGrid = linspace(0, plot.ymax, meshDensity + 1);
    const squares = [];

    for (let i = 0; i < meshDensity; i++) {
        for (let j = 0; j < meshDensity; j++) {
            squares.push([
                {x: xGrid[i],     y: yGrid[j]},
                {x: xGrid[i + 1], y: yGrid[j]},
                {x: xGrid[i + 1], y: yGrid[j + 1]},
                {x: xGrid[i],     y: yGrid[j + 1]}
            ]);
        }
    }

    // calculate f at the four corners of each square and store the signs and values
    for (let square of squares){
        const [p1, p2, p3, p4] = square;
        const f1 = F(p1.x, p1.y);
        const f2 = F(p2.x, p2.y);
        const f3 = F(p3.x, p3.y);
        const f4 = F(p4.x, p4.y);
        square.signs = [Math.sign(f1), Math.sign(f2), Math.sign(f3), Math.sign(f4)];
        square.values = [f1, f2, f3, f4];
    }


    // inspect the four edges of each square
    for (let square of squares) {
        const [p1, p2, p3, p4] = square;
        const signs = square.signs;
        const values = square.values;
        const intersections = [];

        // check each edge for a sign change, and if there is one, interpolate to find zero crossing
        if (signs[0] !== signs[1]) {
            intersections.push(interpolateZeroCrossing(p1, values[0], p2, values[1]));
        }
        if (signs[1] !== signs[2]) {
            intersections.push(interpolateZeroCrossing(p2, values[1], p3, values[2]));
        }
        if (signs[2] !== signs[3]) {
            intersections.push(interpolateZeroCrossing(p3, values[2], p4, values[3]));
        }
        if (signs[3] !== signs[0]) {
            intersections.push(interpolateZeroCrossing(p4, values[3], p1, values[0]));
        }

        // if there are exactly two intersections, draw a line between them
        if (intersections.length === 2) {
            const [int1, int2] = intersections;
            drawLine(int1.x, int1.y, int2.x, int2.y, plot);
        }

        // if there are four intersections, draw lines between the midpoints of opposite edges
        if (intersections.length === 4) {
            const [int1, int2, int3, int4] = intersections;
            drawLine(int1.x, int1.y, int3.x, int3.y, plot);
        }
    }
}

// approximate f(x,y) = 0 using marching squares (LLM -- dashed lines work)
function drawImplicitCurveLLM(f, meshDensity = 500) {

    //hard-code phase plot
    const plot = plots.phase;

    // Width and height of each grid square
    const dx = plot.xmax / meshDensity;
    const dy = plot.ymax / meshDensity;

    // Values smaller than this are treated as zero
    const tolerance = 1e-10;

    /*
     * Estimate where f = 0 along an edge.
     *
     * We assume that f changes linearly between p1 and p2.
     */
    function zeroPoint(p1, p2) {
        const denominator = p1.value - p2.value;

        // Avoid division by a number extremely close to zero
        let t;

        if (Math.abs(denominator) < tolerance) {
            t = 0.5;
        } else {
            t = p1.value / denominator;
        }

        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };
    }

    /*
     * Find whether the zero contour crosses an edge.
     *
     * Returns the crossing point if one exists.
     * Returns null if there is no crossing.
     */
    function edgeIntersection(p1, p2) {
        // Ignore edges containing invalid function values
        if (!Number.isFinite(p1.value) || !Number.isFinite(p2.value)) {
            return null;
        }

        const p1NearZero = Math.abs(p1.value) < tolerance;
        const p2NearZero = Math.abs(p2.value) < tolerance;

        // Check whether the values have opposite signs
        const hasCrossing =
            (p1.value > tolerance && p2.value < -tolerance) ||
            (p1.value < -tolerance && p2.value > tolerance);

        // If both endpoints are approximately zero, the whole edge is
        // approximately part of the contour. We ignore this special case.
        if (p1NearZero && p2NearZero) {
            return null;
        }

        // A crossing occurs if the signs differ or one endpoint is near zero
        if (hasCrossing || p1NearZero || p2NearZero) {
            return zeroPoint(p1, p2);
        }

        return null;
    }

    // Each segment will be stored as a pair of endpoints
    const segments = [];

    /*
     * Examine one grid square and find the contour segments inside it.
     */
    function findSegmentsInSquare(
        bottomLeft,
        bottomRight,
        topRight,
        topLeft
    ) {
        // Find possible intersections on each of the four edges
        const bottomIntersection =
            edgeIntersection(bottomLeft, bottomRight);

        const rightIntersection =
            edgeIntersection(bottomRight, topRight);

        const topIntersection =
            edgeIntersection(topRight, topLeft);

        const leftIntersection =
            edgeIntersection(topLeft, bottomLeft);

        // Collect the intersections that actually exist
        const intersections = [];

        if (bottomIntersection !== null) {
            intersections.push(bottomIntersection);
        }

        if (rightIntersection !== null) {
            intersections.push(rightIntersection);
        }

        if (topIntersection !== null) {
            intersections.push(topIntersection);
        }

        if (leftIntersection !== null) {
            intersections.push(leftIntersection);
        }

        /*
         * Usually, the contour crosses exactly two edges.
         * Join those two crossing points with one segment.
         */
        if (intersections.length === 2) {
            segments.push([
                intersections[0],
                intersections[1]
            ]);

            return;
        }

        /*
         * If all four edges are crossed, the square is ambiguous.
         *
         * This happens when diagonally opposite corners have the
         * same sign. We evaluate f at the centre of the square to
         * decide how to connect the four intersection points.
         */
        if (intersections.length === 4) {
            const centreX = (bottomLeft.x + topRight.x) / 2;
            const centreY = (bottomLeft.y + topRight.y) / 2;
            const centreValue = f(centreX, centreY);

            if (!Number.isFinite(centreValue)) {
                return;
            }

            /*
             * Compare the sign at the centre with the sign at the
             * bottom-left corner.
             *
             * This determines which regions appear connected through
             * the centre of the square.
             */
            const centreIsPositive = centreValue >= 0;
            const bottomLeftIsPositive = bottomLeft.value >= 0;

            if (centreIsPositive === bottomLeftIsPositive) {
                // Connect around the bottom-right and top-left corners
                segments.push([
                    bottomIntersection,
                    rightIntersection
                ]);

                segments.push([
                    topIntersection,
                    leftIntersection
                ]);
            } else {
                // Connect around the bottom-left and top-right corners
                segments.push([
                    leftIntersection,
                    bottomIntersection
                ]);

                segments.push([
                    rightIntersection,
                    topIntersection
                ]);
            }
        }
    }

    /*
     * Move through every square in the grid.
     */
    for (let i = 0; i < meshDensity; i++) {
        for (let j = 0; j < meshDensity; j++) {
            const x1 = i * dx;
            const x2 = x1 + dx;
            const y1 = j * dy;
            const y2 = y1 + dy;

            // Evaluate f at the four corners of this square
            const bottomLeft = {
                x: x1,
                y: y1,
                value: f(x1, y1)
            };

            const bottomRight = {
                x: x2,
                y: y1,
                value: f(x2, y1)
            };

            const topRight = {
                x: x2,
                y: y2,
                value: f(x2, y2)
            };

            const topLeft = {
                x: x1,
                y: y2,
                value: f(x1, y2)
            };

            // Find the contour segment or segments inside this square
            findSegmentsInSquare(
                bottomLeft,
                bottomRight,
                topRight,
                topLeft
            );
        }
    }

    /*
     * Join the small segments into longer curves.
     */

    // Two endpoints closer than this are treated as the same point
    const epsilon = 1e-6;

    // Store the indices of segments that have already been drawn
    const used = new Set();

    function pointsClose(p1, p2) {
        return (
            Math.abs(p1.x - p2.x) < epsilon &&
            Math.abs(p1.y - p2.y) < epsilon
        );
    }

    /*
     * Start with each unused segment and repeatedly search for
     * another segment connected to its current endpoint.
     */
    for (let i = 0; i < segments.length; i++) {
        if (used.has(i)) {
            continue;
        }

        const firstSegment = segments[i];

        plot.ctx.beginPath();

        plot.ctx.moveTo(
            canvasX(firstSegment[0].x, plot),
            canvasY(firstSegment[0].y, plot)
        );

        plot.ctx.lineTo(
            canvasX(firstSegment[1].x, plot),
            canvasY(firstSegment[1].y, plot)
        );

        used.add(i);

        let currentEnd = firstSegment[1];
        let foundConnectedSegment = true;

        while (foundConnectedSegment) {
            foundConnectedSegment = false;

            // Search through the unused segments for a matching endpoint
            for (let j = 0; j < segments.length; j++) {
                if (used.has(j)) {
                    continue;
                }

                const nextSegment = segments[j];

                /*
                 * The first endpoint of the next segment matches the
                 * current endpoint, so draw towards its second endpoint.
                 */
                if (pointsClose(currentEnd, nextSegment[0])) {
                    plot.ctx.lineTo(
                        canvasX(nextSegment[1].x, plot),
                        canvasY(nextSegment[1].y, plot)
                    );

                    currentEnd = nextSegment[1];
                    used.add(j);
                    foundConnectedSegment = true;
                    break;
                }

                /*
                 * The second endpoint matches instead, so traverse
                 * the segment in the opposite direction.
                 */
                if (pointsClose(currentEnd, nextSegment[1])) {
                    plot.ctx.lineTo(
                        canvasX(nextSegment[0].x, plot),
                        canvasY(nextSegment[0].y, plot)
                    );

                    currentEnd = nextSegment[0];
                    used.add(j);
                    foundConnectedSegment = true;
                    break;
                }
            }
        }

        plot.ctx.stroke();
    }
}

