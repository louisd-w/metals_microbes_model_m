
// plot configurations
const leftMargin = 50;
const rightMargin = 20;
const topMargin = 20;
const bottomMargin = 50;

const phaseCanvas = document.getElementById("phaseCanvas");
const timeCanvas = document.getElementById("timeCanvas");

const plots = {
    phase: {
        canvas: phaseCanvas,
        ctx: phaseCanvas.getContext("2d"),
        xmax: 6,
        ymax: 6,
        leftMargin: leftMargin,
        rightMargin: rightMargin,
        topMargin: topMargin,
        bottomMargin: bottomMargin,
        plotWidth: phaseCanvas.width - leftMargin - rightMargin,
        plotHeight: phaseCanvas.height - topMargin - bottomMargin
    },
    time: {
        canvas: timeCanvas,
        ctx: timeCanvas.getContext("2d"),
        xmax: 10,
        ymax: 6,
        leftMargin: leftMargin,
        rightMargin: rightMargin,
        topMargin: topMargin,
        bottomMargin: bottomMargin,
        plotWidth: timeCanvas.width - leftMargin - rightMargin,
        plotHeight: timeCanvas.height - topMargin - bottomMargin
    }
};

// initial parameters
let a = 5;
let b = 2;
let c = 0.5;
let d = 1;
let phi = 1;
let K = 10;
let a_f = 1;
let W_c = 1;
let K_b = 1;


// Model M functions
const mu = (M) => d + phi * c * M;
const beta = (M) => (a * M) / (b + M) - (1 - phi) * c * M;
const U = (M) =>  a_f * M + (W_c * M) / (K_b + M);
const U_prime = (M) =>  a_f + (W_c * K_b) / (K_b + M)**2;
const S = (C, M) =>  C * (beta(M) * (1 - C / K) - mu(M));


// Model M ODEs
const F = (C, M) => S(C, M);
const G = (C, M) => -U(M) * S(C, M) / (1 + C * U_prime(M));


// Cool spirals
//const F = (C, M) => M - 0.5*C;
//const G = (C, M) => Math.sin(C);

// vector field grid
updateVectorFieldGrid(20);

// initial phase plot
drawPhasePlot();

// draw time plot and legend
drawTimePlot();
drawLegend("C", "M", plots.time);


// event listener for button
document.getElementById("parameter-form").addEventListener("submit", function (event) {

    // stop form from submitting and refreshing the page
    event.preventDefault();

    // get form data
    const form = new FormData(event.currentTarget);

    // extract values from form and convert to numbers
    const values = Object.fromEntries(
        Array.from(form, ([name, value]) => [name, Number(value)])
    );

    // update parameters
    ({a, b, c, d, phi, K, a_f, W_c, K_b} = values);

    // update axes
    plots.phase.xmax = values.xmax;
    plots.phase.ymax = values.xmax;
    updateVectorFieldGrid(20);

    // redraw plots with new parameters
    drawPhasePlot();
    drawTimePlot();
    drawLegend("C", "M", plots.time);

    // clear any existing trajectory
    currentTrajectory = null;
});

// event listener for clicks
setupClicks();

// event listener for hovering over timeplot
setupTimePlotHover();
