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

    public readonly grid: Cell[] = [];

    constructor(private readonly ctx: GridContext) {}

    fill() {
        for (let i = 0; i < this.ctx.rows * this.ctx.cols; i++) {
            this.grid[i] = new Cell((i / this.ctx.cols) | 0, i % this.ctx.cols);
        }

        this.step(0);
        return;
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

const BAR_WIDTH = 30;
const BOX_WIDTH = 2 + BAR_WIDTH;

document.addEventListener('DOMContentLoaded', function () {
    const dimensions = document.body.getBoundingClientRect();
    const canvas = document.createElement('canvas');

    const height = 100;//dimensions.height + 10;
    const width = 300;//dimensions.width + 10;

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

    ctx.beginPath();

    ctx.strokeStyle = '#4682b4';
    ctx.lineWidth = 30;

    const context = new GridContext(
        1 + Math.ceil(height / BOX_WIDTH),
        1 + Math.ceil(width / BOX_WIDTH),
    )
    const grid = new Grid(context);
    grid.fill();

    const strategy = getStrategy();
    const painter = new Painter(ctx);
    strategy.generate(grid, context).forEach(step => {
        painter.paint(step, grid, context);
    })

    grid.grid.forEach((c, i) => console.log(`cell#${i}:`, c.x, c.y, c.paths));

    console.log('got here', dimensions, grid);
});

function getStrategy(): PaintStrategy {
    return new WaveStrategy(true, false);
}

class Painter {

    constructor(private readonly canvas: CanvasRenderingContext2D) {}

    paint(step: Step, grid: Grid, ctx: GridContext): void {
        for (const [cell, directions] of step.strokes) {
            const x = cell.x;
            const y = cell.y;

            const distance = BOX_WIDTH + (BAR_WIDTH >> 1);
            const gridX = BOX_WIDTH * x;
            const gridY = BOX_WIDTH * y;

            directions.forEach(d => {
                this.canvas.moveTo(gridX, gridY);
                switch (d) {
                    case Direction.UP:
                        this.canvas.lineTo(gridX, gridY - distance);
                        break;
                    case Direction.DOWN:
                        this.canvas.lineTo(gridX, gridY + distance);
                        break;
                    case Direction.LEFT:
                        this.canvas.lineTo(gridX - distance, gridY);
                        break;
                    case Direction.RIGHT:
                        this.canvas.lineTo(gridX + distance, gridY);
                        break;
                    case Direction.VISITED: break;
                    case Direction.UNVISITED: break;
                }
                this.canvas.stroke();
            });
        }
    }
}
