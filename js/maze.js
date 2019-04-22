var barWidth = 30
  , color = "#4682b4"
  , dimensions
  , drawTime = 125
  , gap = 32
  , height
  , width
  , graph
  , stack = []
  , ctx
  ;

// to use random colors, use `color = getRandom(colors)`
// var colors = ["rgb(73,186,57)", "rgb(255,127,127)", "steelblue"]

document.addEventListener("DOMContentLoaded", function () {
    dimensions = document.body.getBoundingClientRect();
    height = dimensions.height + 10;
    width = dimensions.width + 10;
    ctx = initCanvas();
    graph = fill();

    step([0, 0]);
});

function animateDraw (location, deltaX, deltaY, done) {
    var vector = deltaX || deltaY
      , maxSteps = Math.ceil(0.06 * drawTime)   // 60 frames per 1000 ms
      , distance = vector / maxSteps
      , x = gap * location[0]
      , y = gap * location[1]
      ;

    drawStep(1);

    function drawStep (steps) {
        if (steps > maxSteps)
            return done();

        if (deltaX) {
            ctx.moveTo(x + (steps - 1) * distance, y);
            ctx.lineTo(x + steps * distance, y);
        } else {
            ctx.moveTo(x, y + (steps - 1) * distance);
            ctx.lineTo(x, y + steps * distance);
        }
        ctx.stroke();
        window.requestAnimationFrame(drawStep.bind(null, steps + 1));
    }
}

function draw (location, direction, done) {
    /*
        the distance traveled on any move (where the direction
        if not 0) is equal to the gap plus half the bar width
            distance = gap + (barWidth >> 1)
        the vector (directional distance) will be equal to
        (-1 raised to the power of direction mod 2) times distance
            v = Math.pow(-1, direction % 2) * distance
        if the direction is 1 or 2 (north or south)
            deltaY = v
        else (the direction is 3 or 4 [west or east])
            deltaX = v
    */

    var distance = gap + (barWidth >> 1)
      , vector = Math.pow(-1, direction % 2) * distance
      ;
    switch (direction) {
        case 1: case 2: return animateDraw(location, 0, vector, done);
        case 3: case 4: return animateDraw(location, vector, 0, done);
        default:        return done();
    }
}

function empty (location) {
    if (!location) return -1;

    var row = location[0]
      , col = location[1]
      , holder = []
      ;

    if (col > 0 && graph[row][col-1] === 0)                     // North
        holder.push(1);
    if (col < graph[row].length - 2 && graph[row][col+1] === 0) // South
        holder.push(2);
    if (row > 0 && graph[row-1][col] === 0)                     // East
        holder.push(3);
    if (row < graph.length - 2 && graph[row+1][col] === 0)      // West
        holder.push(4);

    return getRandom(holder) || 0;
}

function fill () {
    var x = Math.ceil(2 + width/gap)
      , y = Math.ceil(3 + height/gap)
      , holder = [];
      ;

    for (var i = x - 1; i--;) {
        holder[i] = [];
        for (var j = y - 1; j--;) {
            holder[i][j] = 0;
        }
    }
    return holder;
}

function getRandom (arr) {
    var pos = (arr.length * Math.random()) | 0;
    return arr[pos];
}

function initCanvas () {
    var canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.height = height;
    canvas.width = width;
    canvas.id = "canvas";

    var ctx = canvas.getContext("2d");

    var pixelRatio = window.devicePixelRatio || 1;

    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    canvas.width *= pixelRatio;
    canvas.height *= pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    ctx.beginPath();

    ctx.strokeStyle = color;
    ctx.lineWidth = barWidth;

    return ctx;
}

function step (location) {
    var row = location[0]
      , col = location[1]
      , place = []
      ;

    graph[row][col] = 1;
    stack.push(location);

    var next = empty(location);

    draw(location, next, function () {
        if (next) {
            switch (next) {
                case 1: place = [row, col - 1]; break;
                case 2: place = [row, col + 1]; break;
                case 3: place = [row - 1, col]; break;
                case 4: place = [row + 1, col]; break;
            }
        } else if (!next && (row || col) && stack.length) {
            do {
                place = stack.pop();
            } while (!empty(place));
        }

        if (place) {
            step(place);
        } else {
            console.log("finished drawing maze");
        }
    });
}
