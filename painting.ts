import { Cell, Direction, Grid, GridContext} from './grid'
import { random } from './helpers'

export const BAR_COLOR = '#4682b4'
export const GAP = 2;
export const BAR_WIDTH = 32;
export const BOX_WIDTH = GAP + BAR_WIDTH;
export const PAINT_OFFSET = (BOX_WIDTH / 2) | 0;

export class Step {
    constructor(public readonly strokes: Map<Cell, Set<Direction>>) {}
}

export interface PaintStrategy {
    generate(grid: Grid, ctx: GridContext): Step[];
}

// zig zag thru the grid to generate waves of cells to paint
export class WaveStrategy implements PaintStrategy {
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

        let direction = Math.random() < 0.5;
        for (let x = 0; x < iterations; x++) {
            const wave: Cell[] = [];

            const boundingX = Math.min(x, ctx.rows - 1)
            const yOffset = x < ctx.rows - 1 ? 0 : x - ctx.rows + 1;

            for (let y = 0; y + yOffset < ctx.cols && boundingX >= y; y++) {
                wave.push(grid.get(boundingX - y, y + yOffset)!)
            }

            if (this.zigzag) {
                if (direction) {
                    wave.reverse();
                }
                direction = !direction;
            }

            if (this.zip) { // draw each cell 1-by-1
                wave.forEach(w => steps.push(new Step(new Map([[w, new Set(w.paths.keys())]]))))
            } else {        // draw each steps in the wave in sync
                steps.push(new Step(new Map(wave.map(w => [w, new Set(w.paths.keys())]))))
            }
        }

        return steps;
    }
}

export class BfsWalk implements PaintStrategy {

    generate(grid: Grid, ctx: GridContext): Step[] {
        const steps: Step[] = [];
        let cells = [grid.get(0, 0)]
        const visited: Set<Cell> = new Set()

        while (cells.length) {
            const nextCells: Cell[] = []
            const nextWave = new Step(new Map())

            cells.forEach(cell => {
                if (cell && !visited.has(cell)) {
                    visited.add(cell);
                    nextWave.strokes.set(cell, new Set(cell.paths.keys()));
                    nextCells.push(...cell.paths.values())
                }
            })
            cells = nextCells;
            steps.push(nextWave);
        }

        return steps;
    }
}

export class LinearWalk implements PaintStrategy {
    constructor(private readonly glompingFactor: number) {}

    generate(grid: Grid, ctx: GridContext): Step[] {
        const steps: Step[] = [];
        for (let i = 0; i < ctx.cols; i++) {
            for (let j = 0; j < Math.max(1, ctx.rows / this.glompingFactor); j++) {
                const nextStep = new Step(new Map());
                for (let k = 0; k < this.glompingFactor; k++) {
                    const cell = grid.get(j * this.glompingFactor + k, i);
                    if (cell) {
                        nextStep.strokes.set(cell, new Set(cell.paths.keys()));
                    }
                }
                steps.push(nextStep);
            }
        }

        return steps;
    }
}

export class RandomWalk implements PaintStrategy {

    constructor(private readonly concurrentCells: number) {}

    generate(grid: Grid, ctx: GridContext): Step[] {
        const steps: Step[] = [];

        const ordered: Cell[] = []
        for (let x = 0; x < ctx.rows; x++) {
            for (let y = 0; y < ctx.cols; y++) {
                ordered.push(grid.get(x, y)!)
            }
        }

        RandomWalk.shuffle(ordered);

        let i = 0;
        while (i < ordered.length) {
            const m: Map<Cell, Set<Direction>> = new Map();
            for (let j = 0; j < this.concurrentCells && i + j < ordered.length; j++) {
                const cell = ordered[i + j];
                m.set(cell, new Set(cell.paths.keys()));
            }
            steps.push(new Step(m));
            i += this.concurrentCells;
        }

        return steps;
    }

    private static shuffle(arr: any[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = random(0, i+1);
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
}

export class Spiraled implements PaintStrategy {

    constructor(
        private readonly centers: number,
        private readonly zip: boolean) {}

    generate(grid: Grid, ctx: GridContext): Step[] {
        const tuples: [number, number][] = Array.from({ length: this.centers }, () => [random(0, ctx.rows), random(0, ctx.cols)]);

        const steps: Step[] = [];
        let r = 0;
        const visited: Set<Cell> = new Set();

        while (visited.size < ctx.rows * ctx.cols) {
            const up: Step[] = [], right: Step[] = [], down: Step[] = [], left: Step[] = [];
            for (let i = 0; i < tuples.length; i++) {
                const [x, y] = tuples[i];
                if (r == 0) {
                    this.appendTo(up, this.walkDirection(grid, visited, x, y + r, Direction.UP, 1));
                } else {
                    this.appendTo(up, this.walkDirection(grid, visited, x, y + r, Direction.UP, r));
                    this.appendTo(right, this.walkDirection(grid, visited, x - r, y, Direction.RIGHT, r));
                    this.appendTo(down, this.walkDirection(grid, visited, x, y - r, Direction.DOWN, r));
                    this.appendTo(left, this.walkDirection(grid, visited, x + r, y, Direction.LEFT, r));
                }
            }
            steps.push(...up, ...right, ...down, ...left);
            r++;
        }
        return steps;
    }

    private appendTo(steps: Step[], nextSteps: Step[]): void {
        if (this.zip && steps.length) {
            const split = Math.min(steps.length, nextSteps.length);
            for (let i = 0; i < split; i++) {
                nextSteps[i].strokes.forEach((v, k) => {
                    steps[i].strokes.set(k, v);
                })
            }
            for (let j = split; j < nextSteps.length; j++) {
                steps.push(nextSteps[j]);
            }
        } else {
            steps.push(...nextSteps)
        }
    }

    private walkDirection(grid: Grid, visited: Set<Cell>, x: number, y: number, direction: Direction, radius: number): Step[] {
        const tuple = this.tuple(direction);
        const steps: Step[] = [];
        for (let step = 0; step < radius; step++) {
            const cell = grid.get(x + tuple[0] * step, y + tuple[1] * step);
            if (cell && !visited.has(cell)) {
                visited.add(cell);
                const m = new Map()
                m.set(cell, new Set(cell.paths.keys()));
                steps.push(new Step(m));
            }
        }
        return steps;
    }

    private tuple(direction: Direction): [number, number] {
        // assuming clockwise direction
        switch (direction) {
            case Direction.UP:     return [-1, -1];  // walk NW
            case Direction.RIGHT:  return [ 1, -1];  // walk NE
            case Direction.DOWN:   return [ 1,  1];  // walk SE
            case Direction.LEFT:   return [-1,  1];  // walk SW
        }
    }
}

export class Painter {

    private static STEPS: number = 1;

    constructor(private readonly canvas: CanvasRenderingContext2D) {}

    paint(step: Step, grid: Grid, ctx: GridContext, done: () => void): void {
        window.requestAnimationFrame(() => this.drawFrame(1, ctx, step, done));
    }

    private outOfBoundsDraw(x: number, y: number, d: Direction, ctx: GridContext): boolean {
        switch (d) {
            case Direction.UP:      return x === 0;
            case Direction.DOWN:    return x === ctx.cols - 1;
            case Direction.LEFT:    return y === 0;
            case Direction.RIGHT:   return y === ctx.rows - 1;
        };
    }

    private drawFrame(n: number, ctx: GridContext, step: Step, done: () => void): void {
        if (n > Painter.STEPS) {
            return done();
        }

        for (const [cell, directions] of step.strokes) {
            directions.forEach(d => {
                const distance = 1 + (this.outOfBoundsDraw(cell.x, cell.y, d, ctx) ? BAR_WIDTH : BOX_WIDTH);
                const start = distance * (n-1) / Painter.STEPS;
                const drawDistance = distance / Painter.STEPS;

                this.canvas.beginPath();

                let gridX = BOX_WIDTH * cell.x;
                let gridY = BOX_WIDTH * cell.y;

                switch (d) {
                    /*
                          U               L
                        L + R  becomes  U + D because reflection across y=x
                          D               R
                    */
                    case Direction.LEFT: // screen UP
                        gridX += BAR_WIDTH / 2;
                        gridY += BAR_WIDTH;
                        this.canvas.moveTo(gridX, gridY - start);
                        this.canvas.lineTo(gridX, gridY - start - drawDistance);
                        break;
                    case Direction.RIGHT: // screen DOWN
                        gridX += BAR_WIDTH / 2;
                        gridY += 0;
                        this.canvas.moveTo(gridX, gridY + start);
                        this.canvas.lineTo(gridX, gridY + start + drawDistance);
                        break;
                    case Direction.UP: // screen LEFT
                        gridX += BAR_WIDTH
                        gridY += BAR_WIDTH / 2;
                        this.canvas.moveTo(gridX - start, gridY);
                        this.canvas.lineTo(gridX - start - drawDistance, gridY);
                        break;
                    case Direction.DOWN: // screen RIGHT
                        gridX += 0;
                        gridY += BAR_WIDTH / 2;
                        this.canvas.moveTo(gridX + start, gridY);
                        this.canvas.lineTo(gridX + start + drawDistance, gridY);
                        break;
                }
                this.canvas.stroke();
            });
        }

        // this.canvas.stroke();
        window.requestAnimationFrame(() => this.drawFrame(n+1, ctx, step, done));
    }
}
