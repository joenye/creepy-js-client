const PositionGrid = (width, height) => new2dArray(width, height)

const new2dArray = (width, height) => {
  const array = []
  for (let i = 0; i < height; i++) {
    array.push(new Array(height))
  }
  return array
}

export const gridWidth = (grid) => grid[0].length
export const gridHeight = (grid) => grid.length

export const getElement = (grid, position) => grid[position.x][position.y]

export const updatePropsAt = (grid_, position, newProps) => {
  let grid = grid_.slice()
  grid[position.x][position.y] = {
    ...grid[position.x][position.y],
    ...newProps
  }
  return grid
}

export const erasePropsAt = (grid_, position) => {
  const grid = grid_.slice()
  grid[position.x][position.y] = {}
  return grid
}

export const updateGridProps = (grid_, newProps) => {
  const grid = grid_.slice()
  for (let x = 0; x < gridWidth(grid); x++) {
    for (let y = 0; y < gridHeight(grid); y++) {
      grid[x][y] = { ...grid[x][y], ...newProps }
    }
  }
  return grid
}

export const eraseGridProps = (grid_) => {
  const grid = grid_.slice()
  for (let x = 0; x < gridWidth(grid); x++) {
    for (let y = 0; y < gridHeight(grid); y++) {
      grid[x][y] = {}
    }
  }
  return grid
}

export default PositionGrid
