enum Direction {
    UNVISITED = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 4,
    LEFT = 8,
    VISITED = 16,
}

class Grid {

    readonly grid: Set<Direction>[] = [];
    private readonly path: number[] = [0];

    constructor(readonly rows: number, readonly cols: number) {
        for (let i = 0; i < rows * cols; i++) {
            this.grid.push(new Set([Direction.UNVISITED]))
        }
    }

    fill() {
        while (this.path.length) {
            const location = this.path[this.path.length-1]!
            const options = this.options(location)

            // if no options at this spot anymore, skip it
            if (options.length === 0) {
                this.path.pop();
                this.mark(location, Direction.VISITED);
                continue;
            }

            const [nextLocation, direction] = options[(Math.random() * options.length) | 0];
            this.mark(location, direction);
            this.path.push(nextLocation);
        }
    }

    private index(row: number, col: number): number {
        return col + (row * this.cols);
    }

    private options(location: number): [number, Direction][] {
        const x = (location / this.cols) | 0
        const y = location % this.cols

        let options: any[] = []

        if (!this.visited(x-1, y)) options.push([this.index(x-1, y), Direction.UP]);
        if (!this.visited(x+1, y)) options.push([this.index(x+1, y), Direction.DOWN]);
        if (!this.visited(x, y-1)) options.push([this.index(x, y-1), Direction.LEFT]);
        if (!this.visited(x, y+1)) options.push([this.index(x, y+1), Direction.RIGHT]);

        return options;
    }

    private mark(location: number, direction: Direction): void {
        this.grid[location].delete(Direction.UNVISITED);
        this.grid[location].add(direction);
    }

    private visited(row: number, col: number): boolean {
        // consider rows outside of the grid visited
        return col < 0 || col >= this.cols
            || row < 0 || row >= this.rows
            || !this.grid[this.index(row, col)].has(Direction.UNVISITED);
    }
}
