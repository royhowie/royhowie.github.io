export enum Direction {
    UP = 1,
    RIGHT = 2,
    DOWN = 4,
    LEFT = 8,
}

export class Cell {

    public readonly paths: Map<Direction, Cell> = new Map();

    constructor(public readonly x: number, public readonly y: number) {}

    visited(): boolean {
        return this.paths.size > 0;
    }

    walkTo(direction: Direction, other: Cell): void {
        this.paths.set(direction, other);
        switch (direction) {
            case Direction.UP:      other.paths.set(Direction.DOWN, this);  break;
            case Direction.DOWN:    other.paths.set(Direction.UP, this);    break;
            case Direction.LEFT:    other.paths.set(Direction.RIGHT, this); break;
            case Direction.RIGHT:   other.paths.set(Direction.LEFT, this);  break;
        }
    }
}

export class GridContext {
    constructor(
        public readonly rows: number,
        public readonly cols: number) {}
}

export class Grid {

    private readonly grid: Cell[] = [];

    constructor(private readonly ctx: GridContext) {
        for (let i = 0; i < this.ctx.rows; i++) {
            for (let j = 0; j < this.ctx.cols; j++) {
                this.grid[i*this.ctx.cols+j] = new Cell(i, j);
            }
        }
    }

    get(row: number, col: number): (Cell | undefined) {
        if (row < 0 || row >= this.ctx.rows) return undefined;
        if (col < 0 || col >= this.ctx.cols) return undefined;
        return this.grid[col + (row * this.ctx.cols)];
    }
}

export interface GridWalker {
    newGrid(ctx: GridContext): Grid;
}

export class BfsFill implements GridWalker {

    constructor(private readonly ctx: GridContext) {}

    newGrid(): Grid {
        const grid = new Grid(this.ctx);
        this.step(grid.get(0, 0)!, grid);
        return grid;
    }

    private options(cell: Cell, grid: Grid): [Cell, Direction][] {
        const options: [Cell | undefined, Direction][] = [
            [grid.get(cell.x-1, cell.y), Direction.UP],
            [grid.get(cell.x+1, cell.y), Direction.DOWN],
            [grid.get(cell.x, cell.y-1), Direction.LEFT],
            [grid.get(cell.x, cell.y+1), Direction.RIGHT],
        ];
        return options.filter(([cell, direction]) => cell && !cell.visited()) as [Cell, Direction][];
    }

    private step(cell: Cell, grid: Grid): void {
        while (true) {
            const options = this.options(cell, grid);
            if (!options.length) {
                break;
            }
            const [nextCell, direction] = options[(Math.random() * options.length) | 0];
            cell.walkTo(direction, nextCell);
            this.step(nextCell, grid);
        };
    }
}

export class RecursiveDivide implements GridWalker {

    constructor(private readonly ctx: GridContext) {}

    newGrid(): Grid {
        const grid = new Grid(this.ctx);
        this.divide(grid, 0, 0, this.ctx.rows, this.ctx.cols);
        return grid;
    }

    divide(grid: Grid, x: number, y: number, limitX: number, limitY: number): void {
        if (limitX - x <= 1 || limitY - y <= 1) return;

        if (limitY < limitX) { // horizontal division
            const row = this.random(x+1, limitX);
            const col = this.random(y, limitY - 1);
            console.log(`[horizontal]: picked (${row},${col}) from ${x}-${limitX} & ${y}-${limitY}`)

            for (let i = y; i < limitY - 1; i++) {
                grid.get(row-1, i)!.walkTo(Direction.RIGHT, grid.get(row-1, i+1)!)
                grid.get(row, i)!.walkTo(Direction.RIGHT, grid.get(row, i+1)!)
            }
            grid.get(row-1, col)!.walkTo(Direction.DOWN, grid.get(row, col)!)

            this.divide(grid, x, y, row, limitY);
            this.divide(grid, row, y, limitX, limitY);
        } else { // vertical division
            const row = this.random(x, limitX);
            const col = this.random(y+1, limitY - 1);
            console.log(`[horizontal]: picked (${row},${col}) from ${x}-${limitX} & ${y}-${limitY}`)

            for (let i = x; i < limitX - 1; i++) {
                grid.get(i, col-1)!.walkTo(Direction.DOWN, grid.get(i+1, col-1)!)
                grid.get(i, col)!.walkTo(Direction.DOWN, grid.get(i+1, col)!)
            }
            grid.get(row, col-1)!.walkTo(Direction.RIGHT, grid.get(row, col)!)

            this.divide(grid, x, y, limitX, col);
            this.divide(grid, x, col, limitX, limitY);
        }
    }

    private random(start: number, stopExclusive: number): number {
        return start + Math.floor((stopExclusive - start) * Math.random());
    }
}
