import { Cell, Direction, Grid, GridContext} from './grid'

export const BAR_COLOR = '#4682b4'
export const GAP = 4;
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
                wave.push(grid.get(boundingX - y, y + yOffset))
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

        while (cells.length) {
            const nextCells: Cell[] = []
            const nextWave = new Step(new Map())

            cells.forEach(cell => {
                nextWave.strokes.set(cell, new Set(cell.paths.keys()));

                for (const direction of cell.paths.keys()) {
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
                }
            })
            cells = nextCells;
            steps.push(nextWave);
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
                ordered.push(grid.get(x, y))
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
            const j = Math.floor(Math.random() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
}

const DRAW_DISTANCE = GAP + BAR_WIDTH * 1.5
export class Painter {

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
            let gridX = BOX_WIDTH * cell.y;
            let gridY = BOX_WIDTH * cell.x;

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
