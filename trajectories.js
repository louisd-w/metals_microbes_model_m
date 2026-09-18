// most recently drawn trajectory
let currentTrajectory = null;

function setupClicks(){
    // event listener for clicks
    phaseCanvas.addEventListener('click', function(event) {
    try {

        // get coordinates of click
        const coords = getMouseCoordinates(event, plots.phase);

        // draw a small dot where clicked
        plots.phase.ctx.fillStyle = 'lime';
        plots.phase.ctx.beginPath();
        plots.phase.ctx.arc(coords.x, coords.y, 5, 0, Math.PI * 2);
        plots.phase.ctx.fill();

        // convert phaseCanvas coordinates to mathematical coordinates
        const x0 = modelX(coords.x, plots.phase);
        const y0 = modelY(coords.y, plots.phase);

        // draw trajectory from clicked point, and add to time plot
        drawTrajectory(F, G, x0, y0);

        // redraw legends
        drawLegend("C nullcline", "M nullcline", plots.phase);
        drawLegend("C", "M", plots.time);

    } catch (err) {
        console.error('Error getting click coordinates:', err);
    }
    });
}

// rk4 step for system of 2 ODEs
function rk4Step(F, G, x, y, dt) {
    const k1x = F(x, y);
    const k1y = G(x, y);

    const k2x = F(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
    const k2y = G(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);

    const k3x = F(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
    const k3y = G(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y );

    const k4x = F(x + dt * k3x, y + dt * k3y);
    const k4y = G(x + dt * k3x, y + dt * k3y);

    return {
        x: x + dt * (k1x + 2 * k2x + 2 * k3x + k4x) / 6,
        y: y + dt * (k1y + 2 * k2y + 2 * k3y + k4y) / 6
    };
}

// draw trajectory from initial point (x0, y0) and add to time plot
function drawTrajectory(F, G, x0, y0, dt = 0.01, steps = 5000) {

    // default values
    let t = [0];
    let x = [x0];
    let y = [y0];

    // phase plot intial point
    plots.phase.ctx.beginPath();
    plots.phase.ctx.moveTo(canvasX(x[0], plots.phase), canvasY(y[0], plots.phase));

    // for stopped trajectories
    let settledSteps = 0;
    const settlingTolerance = 1e-4;
    const requiredSettledSteps = 50;

    // integrate
    for (let i = 0; i < steps; i++) {

        // rk4 step
        const next = rk4Step(F, G, x[x.length - 1], y[y.length - 1], dt);

        // stop if the numerical solution becomes invalid or unreasonably large
        if (
            !Number.isFinite(next.x) ||
            !Number.isFinite(next.y) ||
            Math.abs(next.x) > 1e6 ||
            Math.abs(next.y) > 1e6
        ) {
            break;
        }

        // update arrays
        x.push(next.x);
        y.push(next.y);
        t.push(t[t.length - 1] + dt);

        // check whether the trajectory has remained close to equilibrium
        const speed = Math.hypot(
            F(next.x, next.y),
            G(next.x, next.y)
        );
        if (speed < settlingTolerance) {
            settledSteps++;
        } else {
            settledSteps = 0;
        }
        if (settledSteps >= requiredSettledSteps) {
            break;
        }

        // draw trajectory on phase plot
        plots.phase.ctx.lineTo(canvasX(x[x.length - 1], plots.phase), canvasY(y[y.length - 1], plots.phase));

    }

    // save current trajectory for other plots
    currentTrajectory = {t, x, y};

    //reset time plot and scale the axes
    plots.time.xmax = t[t.length - 1];
    plots.time.ymax = Math.max(Math.max(...x), Math.max(...y))*1.1;
    drawTimePlot();

    // draw trajectories on time plot

    const xTimePath = new Path2D();
    const yTimePath = new Path2D();

    xTimePath.moveTo(canvasX(t[0], plots.time), canvasY(x[0], plots.time));
    yTimePath.moveTo(canvasX(t[0], plots.time), canvasY(y[0], plots.time));

    for (let i = 1; i < t.length; i++) {
        xTimePath.lineTo(canvasX(t[i], plots.time), canvasY(x[i], plots.time));
        yTimePath.lineTo(canvasX(t[i], plots.time), canvasY(y[i], plots.time));
    }

    
    // stroke the paths with styles

    //phase plot trajectory
    setSolidStyle("lime", 2, plots.phase);
    plots.phase.ctx.stroke();
    resetDrawStyle(plots.phase);

    //time plot trajectories
    setSolidStyle("blue", 2, plots.time);
    plots.time.ctx.stroke(xTimePath);
    setSolidStyle("red", 2, plots.time);
    plots.time.ctx.stroke(yTimePath);
    resetDrawStyle(plots.time);

    

}
