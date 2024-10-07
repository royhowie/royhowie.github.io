import { DfsFill, GridContext, RecursiveDivide } from './grid'
import { BAR_COLOR, BAR_WIDTH, BOX_WIDTH, BfsWalk, RandomWalk, Painter, PaintStrategy, PAINT_OFFSET, WaveStrategy, GAP } from './painting';

document.addEventListener('DOMContentLoaded', function () {
    const dimensions = document.body.getBoundingClientRect();
    const canvas = document.createElement('canvas');

    const height = dimensions.height - 30;
    const width = dimensions.width - 30;

    document.body.appendChild(canvas);
    canvas.height = height;
    canvas.width = width;
    canvas.id = 'canvas';

    const ctx = canvas.getContext('2d')!;

    var pixelRatio = window.devicePixelRatio || 1;

    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width *= pixelRatio;
    canvas.height *= pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.translate(GAP, GAP);

    ctx.strokeStyle = BAR_COLOR;
    ctx.lineWidth = BAR_WIDTH;

    console.log('starting generation')
    // Grid uses (x,y) for (rows,cols), i.e. (vert, horiz) distance
    // but Canvas uses (x,y) for (horiz, vert) distance, so swap em
    const context = new GridContext(
        Math.floor(width / BOX_WIDTH),
        Math.floor(height / BOX_WIDTH),
    );
    const grid = Math.random() < 0.5 ?
        new DfsFill(context).newGrid()
        : new RecursiveDivide(context).newGrid();
    const strategy = getStrategy();
    const painter = new Painter(ctx);
    const steps = strategy.generate(grid, context);

    function walkStep(n: number, done: () => void) {
        if (n === steps.length) {
            return done();
        }
        painter.paint(steps[n], grid, context, () => walkStep(n+1, done))
    }
    walkStep(0, () => console.log('done painting!', dimensions, grid));
});

function getStrategy(): PaintStrategy {
    const strategies = [
        new BfsWalk(),
        new RandomWalk(50),
        new WaveStrategy(true, false),
        // new WaveStrategy(true, true),
    ];
    return strategies[(strategies.length * Math.random()) | 0]
}
