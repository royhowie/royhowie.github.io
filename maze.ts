import { DfsFill, Ellers, GridContext, GridWalker, RecursiveDivide } from './grid'
import { BAR_COLOR, BAR_WIDTH, BOX_WIDTH, BfsWalk, LinearWalk, RandomWalk, Painter, PaintStrategy, PAINT_OFFSET, WaveStrategy, GAP, Spiraled } from './painting';

document.addEventListener('DOMContentLoaded', function () {
    const dimensions = document.body.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const pixelRatio = window.devicePixelRatio || 1;

    const height = dimensions.height - GAP;
    const width = dimensions.width - GAP;

    const rows = Math.floor(width / BOX_WIDTH);
    const cols = Math.floor(height / BOX_WIDTH);

    const unscaledWidth = rows * BOX_WIDTH;
    const unscaledHeight = cols * BOX_WIDTH;

    document.body.appendChild(canvas);
    canvas.height = pixelRatio * height;
    canvas.width = pixelRatio * width;

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(width / unscaledWidth, 0, 0, height / unscaledHeight, GAP, GAP);

    ctx.strokeStyle = BAR_COLOR;
    ctx.lineWidth = BAR_WIDTH;

    console.log('starting generation');
    const context = new GridContext(rows, cols);
    const grid = getGenerator(context).newGrid();
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

function getGenerator(context: GridContext): GridWalker {
    const walkers = [
        new DfsFill(context),
        new Ellers(context),
        new RecursiveDivide(context),
    ];
    return walkers[(walkers.length * Math.random()) | 0];
}

function getStrategy(): PaintStrategy {
    const strategies = [
        new BfsWalk(),
        new RandomWalk(50),
        new LinearWalk(3),
        new Spiraled(10, true),
        new WaveStrategy(true, false),
        new WaveStrategy(true, true),
    ];
    return strategies[(strategies.length * Math.random()) | 0];
}
