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
    public readonly neighbors: Set<Cell> = new Set();

    constructor(public readonly x: number, public readonly y: number) {}

    add(direction: Direction): void {
        this.visit();
        this.paths.add(direction);
    }

    visit(): void {
        this.paths.delete(Direction.UNVISITED);
    }

    visited(): boolean {
        return this.paths.size === 0 || !this.paths.has(Direction.UNVISITED);
    }

    static swapInfo(a: Cell, b: Cell): void {
        a.neighbors.add(b);
        b.neighbors.add(a);
        // TODO fix this
        console.log(`(${a.x},${a.y}) <-> (${b.x},${b.y})`, a, b)
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
        this.grid[location].visit();

        while (true) {
            const options = this.options(location);
            if (!options.length) {
                break;
            }
            const [nextLocation, direction] = options[(Math.random() * options.length) | 0];
            this.grid[location].add(direction);
            Cell.swapInfo(this.grid[location], this.grid[nextLocation]);
            this.step(nextLocation);
        };
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

const BAR_COLOR = '#4682b4'
const GAP = 4;
const BAR_WIDTH = 32;
const BOX_WIDTH = GAP + BAR_WIDTH;
const PAINT_OFFSET = (BOX_WIDTH / 2) | 0;
const BALL_RADIUS = (BAR_WIDTH / 3) | 0
var GRID

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

    // ctx.beginPath();

    ctx.strokeStyle = BAR_COLOR;
    ctx.lineWidth = BAR_WIDTH;

    // Grid uses (x,y) for (rows,cols), i.e. (vert, horiz) distance
    // but Canvas uses (x,y) for (horiz, vert) distance, so swap em
    const context = new GridContext(
        Math.ceil(height / BOX_WIDTH),
        Math.ceil(width / BOX_WIDTH),
    )
    const grid = new Grid(context);
    grid.fill();
    GRID = grid;

    const strategy = getStrategy();
    const painter = new Painter(ctx);
    const steps = strategy.generate(grid, context);

    function walkStep(n: number, done: () => void) {
        if (n === steps.length) {
            return done();
        }
        painter.paint(steps[n], grid, context, () => walkStep(n+1, done))
    }

    let mouseEvent: (MouseEvent | undefined)

    const location: [number, number] = [0, 0];
    walkStep(0, () => {
        console.log('done painting!', dimensions, grid);
        canvas.addEventListener('mousemove', (event) => mouseEvent = event);
        drawCircle(context, ctx, location, 'red');
        mouseFollow()
    });

    // const rect = canvas.getBoundingClientRect();

    function mouseFollow() {
        if (mouseEvent) {
            // const [x, y] = bounder(mouseEvent);
            // const [x, y] = [mouseEvent.clientX / BOX_WIDTH, mouseEvent.clientY / BOX_WIDTH];
            // move between 0 and BOX_WIDTH/3 in the direction of the mouse
            const mouseX = mouseEvent.clientX;
            const mouseY = mouseEvent.clientY;

            // FIXME: how are these coordinations generated???
            const dx = mouseEvent.clientY - BOX_WIDTH*location[0];
            const dy = mouseEvent.clientX - BOX_WIDTH*location[1];
            const len = Math.sqrt(dx * dx + dy * dy);

            const vec = [
                dy/len,
                dx/len,
                // bound(-1, 1, mouseY-BOX_WIDTH*location[0]),
                // bound(-1, 1, mouseX-BOX_WIDTH*location[1]),
                //(mouseY-BOX_WIDTH*location[0])/height,
                //(mouseX-BOX_WIDTH*location[1])/width,
            ];
            // get the nearest cell of the current dot;
            // shift back half a cell to account for ctx.translate in the visualization 
            const cell = grid.get(
                Math.round(location[0]),
                Math.round(location[1]),
                //Math.round(location[1]-0.5)
            );
            const GAP_BOUNDARY = (GAP+1)/(2*BOX_WIDTH);

            const boundedMove = [
                Math.max(0, cell.x - 0.5 + GAP_BOUNDARY), // min X
                Math.min(context.rows - 1, cell.x + 0.5 - GAP_BOUNDARY), // max X
                Math.max(0, cell.y - 0.5 + GAP_BOUNDARY), // min Y
                Math.min(context.cols - 1, cell.y + 0.5 - GAP_BOUNDARY), // max Y
            ]

            for (let n of cell.neighbors) {
                if (n.x < cell.x) boundedMove[0] = n.x;
                if (n.x > cell.x) boundedMove[1] = n.x;
                if (n.y < cell.y) boundedMove[2] = n.y;
                if (n.y > cell.y) boundedMove[3] = n.y;
            }

            const nextLocation: [number, number] = [
                bound(boundedMove[0], boundedMove[1], location[0] + vec[0]),
                bound(boundedMove[2], boundedMove[3], location[1] + vec[1]),
                // Math.min(boundedMove[1], Math.max(boundedMove[0], location[0] + vec[0])),
                // Math.min(boundedMove[3], Math.max(boundedMove[2], location[1] + vec[1])),
            ];

            const EPS = 0.01
            if (true || Math.abs(nextLocation[0]-location[0]) > EPS || Math.abs(nextLocation[1]-location[1])) {
                console.log(
                    Date.now(),
                    'current',
                    location,
                    'next',
                    nextLocation,
                    'bounds',
                    boundedMove,
                    'vec',
                    vec);
                drawCircle(context, ctx, location, BAR_COLOR);
                location[0] = nextLocation[0];
                location[1] = nextLocation[1];
                drawCircle(context, ctx, nextLocation, 'red');
            }
        }
        window.requestAnimationFrame(t => mouseFollow());
    }
});

function bound(min: number, max: number, n: number): number {
    return Math.min(max, Math.max(min, n));
}

function drawCircle(gridContext: GridContext, ctx: CanvasRenderingContext2D, [x, y]: [number, number], color: string): void {
    const gridX = y * BOX_WIDTH - BALL_RADIUS;
    const gridY = x * BOX_WIDTH - BALL_RADIUS;
    ctx.beginPath();
    ctx.arc(gridX, gridY, BALL_RADIUS, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
}

function getStrategy(): PaintStrategy {
    const strategies = [
        // new BfsWalk(),
        new RandomWalk(50),
        // new WaveStrategy(true, false),
        // new WaveStrategy(true, true),
    ];
    return strategies[(strategies.length * Math.random()) | 0]
}

const DRAW_DISTANCE = GAP + BAR_WIDTH * 1.5
class Painter {

    private static STEPS: number = 1;

    constructor(private readonly canvas: CanvasRenderingContext2D) {}

    paint(step: Step, grid: Grid, ctx: GridContext, done: () => void): void {
        window.requestAnimationFrame(() => this.drawFrame(1, step, done));
    }

    private drawFrame(n: number, step: Step, done: () => void): void {
        if (n > Painter.STEPS) {
            return done();
        }

        const start = ((n-1)/Painter.STEPS) * DRAW_DISTANCE;
        const drawDistance = DRAW_DISTANCE / Painter.STEPS;

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
                        this.canvas.moveTo(gridX, gridY - start);
                        this.canvas.lineTo(gridX, gridY - start - drawDistance);
                        break;
                    case Direction.DOWN:
                        this.canvas.moveTo(gridX, gridY + start);
                        this.canvas.lineTo(gridX, gridY + start + drawDistance);
                        break;
                    case Direction.LEFT:
                        this.canvas.moveTo(gridX - start, gridY);
                        this.canvas.lineTo(gridX - start - drawDistance, gridY);
                        break;
                    case Direction.RIGHT:
                        this.canvas.moveTo(gridX + start, gridY);
                        this.canvas.lineTo(gridX + start + drawDistance, gridY);
                        break;
                }
            });
        }

        this.canvas.stroke();
        window.requestAnimationFrame(() => this.drawFrame(n+1, step, done));
    }
}
