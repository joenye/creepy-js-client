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

export const getPropsAt = (grid, position) => {
  return grid[position.x][position.y]
}

export const updatePropsAt = (grid, position, newProps) => {
  if (!(grid.hasOwnProperty(position.x) && grid[position.x].hasOwnProperty(position.y))) {
    return grid
  }

  grid[position.x][position.y] = {
    ...grid[position.x][position.y],
    ...newProps
  }
  return grid
}

export const erasePropsAt = (grid, position) => {
  grid[position.x][position.y] = {}
  return grid
}

export const updateGridProps = (grid, newProps) => {
  for (let x = 0; x < gridWidth(grid); x++) {
    for (let y = 0; y < gridHeight(grid); y++) {
      grid[x][y] = { ...grid[x][y], ...newProps }
    }
  }
  return grid
}

export const eraseGridProps = (grid) => {
  for (let x = 0; x < gridWidth(grid); x++) {
    for (let y = 0; y < gridHeight(grid); y++) {
      grid[x][y] = {}
    }
  }
  return grid
}

export default PositionGrid
