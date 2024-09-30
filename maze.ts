enum Direction {
    UNVISITED = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 4,
    LEFT = 8,
    VISITED = 16,
}

class Step {
    constructor(public readonly strokes: Map<Cell, Set<Direction>>) {}
}

interface PaintStrategy {
    generate(grid: Grid, ctx: GridContext): Step[];
}

class GridContext {
    constructor(
        public readonly rows: number,
        public readonly cols: number) {}
}

class Cell {

    public readonly paths: Set<Direction> = new Set([Direction.UNVISITED]);

    constructor(public readonly x: number, public readonly y: number) {}

    add(direction: Direction): void {
        this.paths.delete(Direction.UNVISITED);
        this.paths.add(direction);
    }

    visited(): boolean {
        return !this.paths.has(Direction.UNVISITED);
    }
}

class Grid {

    private readonly grid: Cell[] = [];

    constructor(private readonly ctx: GridContext) {}

    fill() {
        for (let i = 0; i < this.ctx.rows; i++) {
            for (let j = 0; j < this.ctx.cols; j++) {
                this.grid[i*this.ctx.cols+j] = new Cell(i, j);
            }
        }
        this.step(0);
    }

    get(row: number, col: number): Cell {
        return this.grid[this.index(row, col)];
    }

    private index(row: number, col: number): number {
        return col + (row * this.ctx.cols);
    }

    private options(location: number): [number, Direction][] {
        const cell = this.grid[location];
        const x = cell.x;
        const y = cell.y;

        let options: any[] = []

        if (!this.visited(x-1, y)) options.push([this.index(x-1, y), Direction.UP]);
        if (!this.visited(x+1, y)) options.push([this.index(x+1, y), Direction.DOWN]);
        if (!this.visited(x, y-1)) options.push([this.index(x, y-1), Direction.LEFT]);
        if (!this.visited(x, y+1)) options.push([this.index(x, y+1), Direction.RIGHT]);

        return options;
    }

    private step(location: number): void {
        while (true) {
            const options = this.options(location);
            if (!options.length) {
                break;
            }
            const [nextLocation, direction] = options[(Math.random() * options.length) | 0];
            this.grid[location].add(direction);
            this.step(nextLocation);
        };

        this.grid[location].add(Direction.VISITED);
    }

    private visited(row: number, col: number): boolean {
        return col < 0 || col >= this.ctx.cols
            || row < 0 || row >= this.ctx.rows
            || this.grid[this.index(row, col)].visited();
    }
}

// zig zag thru the grid to generate waves of cells to paint
class WaveStrategy implements PaintStrategy {
    constructor(
        // whether to alternative directions
        private readonly zigzag: boolean,
        // whether to do a wave all at once
        private readonly zip: boolean) {}

    generate(grid: Grid, ctx: GridContext): Step[] {
        const steps: Step[] = [];

        // pretend we're rotating the grid such that it's dangling
        // from (0,0) and (x,y) is at the very bottom
        const iterations = ctx.rows + ctx.cols - 1;

        let direction = Math.random() < 0.5 ? Direction.DOWN : Direction.UP;
        for (let x = 0; x < iterations; x++) {
            const wave: Cell[] = [];

            const boundingX = Math.min(x, ctx.rows - 1)
            const yOffset = x < ctx.rows - 1 ? 0 : x - ctx.rows + 1;

            for (let y = 0; y + yOffset < ctx.cols && boundingX >= y; y++) {
                wave.push(grid.get(boundingX - y, y + yOffset))
            }

            if (this.zigzag) {
                if (direction === Direction.DOWN) {
                    wave.reverse();
                    direction = Direction.UP;
                } else {
                    direction = Direction.DOWN;
                }
            }

            if (this.zip) { // draw each cell 1-by-1
                wave.forEach(w => steps.push(new Step(new Map([[w, w.paths]]))))
            } else {        // draw each steps in the wave in sync
                steps.push(new Step(new Map(wave.map(w => [w, w.paths]))))
            }
        }

        return steps;
    }
}

class BfsWalk implements PaintStrategy {

    generate(grid: Grid, ctx: GridContext): Step[] {
        const steps: Step[] = [];
        let cells = [grid.get(0, 0)]

        while (cells.length) {
            const nextCells: Cell[] = []
            const nextWave = new Step(new Map())

            cells.forEach(cell => {
                nextWave.strokes.set(cell, cell.paths);

                cell.paths.forEach(direction => {
                    switch (direction) {
                        case Direction.UP:
                            if (cell.x > 0) {
                                nextCells.push(grid.get(cell.x-1, cell.y));
                            }
                            break;
                        case Direction.DOWN:
                            if (cell.x < ctx.rows - 1) {
                                nextCells.push(grid.get(cell.x+1, cell.y));
                            }
                            break;
                        case Direction.LEFT:
                            if (cell.y > 0) {
                                nextCells.push(grid.get(cell.x, cell.y-1));
                            }
                            break;
                        case Direction.RIGHT:
                            if (cell.y < ctx.cols - 1) {
                                nextCells.push(grid.get(cell.x, cell.y+1));
                            }
                            break;
                    }
                })
            })
            cells = nextCells;
            steps.push(nextWave);
        }

        return steps;
    }
}

class RandomWalk implements PaintStrategy {

    constructor(private readonly concurrentCells: number) {}

    generate(grid: Grid, ctx: GridContext): Step[] {
        const steps: Step[] = [];

        const ordered: Cell[] = []
        for (let x = 0; x < ctx.rows; x++) {
            for (let y = 0; y < ctx.cols; y++) {
                ordered.push(grid.get(x, y))
            }
        }

        RandomWalk.shuffle(ordered);

        let i = 0;
        while (i < ordered.length) {
            const m: Map<Cell, Set<Direction>> = new Map();
            for (let j = 0; j < this.concurrentCells && i + j < ordered.length; j++) {
                const cell = ordered[i + j];
                m.set(cell, cell.paths);
            }
            steps.push(new Step(m));
            i += this.concurrentCells;
        }

        return steps;
    }

    private static shuffle(arr: any[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
}

const GAP = 4;
const BAR_WIDTH = 32;
const BOX_WIDTH = GAP + BAR_WIDTH;
const PAINT_OFFSET = (BOX_WIDTH / 2) | 0;

document.addEventListener('DOMContentLoaded', function () {
    const dimensions = document.body.getBoundingClientRect();
    const canvas = document.createElement('canvas');

    const height = dimensions.height + 10;
    const width = dimensions.width + 10;

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
    ctx.translate(PAINT_OFFSET, PAINT_OFFSET);

    ctx.beginPath();

    ctx.strokeStyle = '#4682b4';
    ctx.lineWidth = BAR_WIDTH;

    const context = new GridContext(
        Math.ceil(height / BOX_WIDTH),
        Math.ceil(width / BOX_WIDTH),
    )
    const grid = new Grid(context);
    grid.fill();

    const strategy = getStrategy();
    const painter = new Painter(ctx);
    const steps = strategy.generate(grid, context);

    function walkStep(n: number, done: () => void) {
        if (n === steps.length) {
            return done();
        }
        painter.paint(steps[n], grid, context, () => walkStep(n+1, done))
    }
    walkStep(0, () => console.log('done painting!'));
    console.log('got here', dimensions, grid);
});

function getStrategy(): PaintStrategy {
    const strategies = [
        new BfsWalk(),
        new RandomWalk(50),
        new WaveStrategy(true, false),
        new WaveStrategy(true, true),
    ];
    return strategies[(strategies.length * Math.random()) | 0]
}

const DRAW_DISTANCE = GAP + BAR_WIDTH * 1.5;
class Painter {

    private static STEPS: number = 1;

    constructor(private readonly canvas: CanvasRenderingContext2D) {}

    paint(step: Step, grid: Grid, ctx: GridContext, done: () => void): void {
        window.requestAnimationFrame(timestamp => {
            this.drawFrame(1, step, done)
        });
    }

    private drawFrame(n: number, step: Step, done: () => void): void {
        if (n > Painter.STEPS) {
            return done();
        }

        const offset = ((n-1)/Painter.STEPS) * DRAW_DISTANCE;
        const distance = (n/Painter.STEPS) * DRAW_DISTANCE;

        for (const [cell, directions] of step.strokes) {
            const gridX = BOX_WIDTH * cell.y;
            const gridY = BOX_WIDTH * cell.x;

            // draw extra for the first cell bc nothing else draws into it
            if (cell.x === 0 && cell.y === 0) {
                this.canvas.moveTo((GAP/2)-PAINT_OFFSET, 0);
                this.canvas.lineTo(BOX_WIDTH, 0);
            }

            directions.forEach(d => {
                switch (d) {
                    case Direction.UP:
                        this.canvas.moveTo(gridX, gridY - offset);
                        this.canvas.lineTo(gridX, gridY - distance);
                        break;
                    case Direction.DOWN:
                        this.canvas.moveTo(gridX, gridY + offset);
                        this.canvas.lineTo(gridX, gridY + distance);
                        break;
                    case Direction.LEFT:
                        this.canvas.moveTo(gridX - offset, gridY);
                        this.canvas.lineTo(gridX - distance, gridY);
                        break;
                    case Direction.RIGHT:
                        this.canvas.moveTo(gridX + offset, gridY);
                        this.canvas.lineTo(gridX + distance, gridY);
                        break;
                }
            });
        }

        this.canvas.stroke();
        window.requestAnimationFrame(t => this.drawFrame(n+1, step, done));
    }
}
