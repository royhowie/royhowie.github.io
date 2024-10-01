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

    get(row: number, col: number): Cell {
        return this.grid[this.index(row, col)];
    }

    private index(row: number, col: number): number {
        return col + (row * this.ctx.cols);
    }
}

export interface GridWalker {
    newGrid(ctx: GridContext): Grid;
}

export class BfsFill implements GridWalker {

    newGrid(ctx: GridContext): Grid {
        const grid = new Grid(ctx);
        this.step(grid.get(0, 0), grid);
        return grid;
    }

    private options(cell: Cell, grid: Grid): [Cell, Direction][] {
        const options: [Cell, Direction][] = [
            [grid.get(cell.x-1, cell.y), Direction.UP],
            [grid.get(cell.x+1, cell.y), Direction.DOWN],
            [grid.get(cell.x, cell.y-1), Direction.LEFT],
            [grid.get(cell.x, cell.y+1), Direction.RIGHT],
        ];
        return options.filter(([cell, direction]) => cell && !cell.visited());
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
