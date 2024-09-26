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
    private readonly path: number[] = [0];

    constructor(private readonly ctx: GridContext) {
        for (let i = 0; i < ctx.rows * ctx.cols; i++) {
            this.grid.push(new Cell())
        }
    }

    fill() {
        while (this.path.length) {
            const location = this.path[this.path.length-1]!
            const options = this.options(location)

            if (options.length === 0) {
                this.path.pop();
                this.grid[location].add(Direction.VISITED);
                continue;
            }

            const [nextLocation, direction] = options[(Math.random() * options.length) | 0];
            this.grid[location].add(direction);
            this.path.push(nextLocation);
        }
    }

    get(row: number, col: number): Cell {
        return this.grid[this.index(row, col)];
    }

    private index(row: number, col: number): number {
        return col + (row * this.ctx.cols);
    }

    private options(location: number): [number, Direction][] {
        const x = (location / this.ctx.cols) | 0
        const y = location % this.ctx.cols

        let options: any[] = []

        if (!this.visited(x-1, y)) options.push([this.index(x-1, y), Direction.UP]);
        if (!this.visited(x+1, y)) options.push([this.index(x+1, y), Direction.DOWN]);
        if (!this.visited(x, y-1)) options.push([this.index(x, y-1), Direction.LEFT]);
        if (!this.visited(x, y+1)) options.push([this.index(x, y+1), Direction.RIGHT]);

        return options;
    }

    private visited(row: number, col: number): boolean {
        return col < 0 || col >= this.ctx.cols
            || row < 0 || row >= this.ctx.rows
            || this.grid[this.index(row, col)].visited();
    }
}

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

            let boundingX = Math.min(x, ctx.rows - 1)
            let yOffset = x < ctx.rows - 1 ? 0 : x - ctx.rows + 1;

            for (let y = 0; y + yOffset < ctx.cols && boundingX >= y; y++) {
                wave.push(grid.get(boundingX - y, y + yOffset))
            }

            if (!this.zigzag) {
                continue; // no need to deal with direction
            }

            if (direction === Direction.DOWN) {
                wave.reverse();
                direction = Direction.UP;
            } else {
                direction = Direction.DOWN;
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
