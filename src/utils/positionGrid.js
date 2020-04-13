const PositionGrid = (width, height) => new2dArray(width, height);

const new2dArray = (width, height) => {
  const array = [];
  for (let i = 0; i < width; i += 1) {
    array.push(new Array(height));
  }
  return array;
};

export const gridWidth = (grid) => grid.length;
export const gridHeight = (grid) => grid[0].length;

export const getPropsAt = (grid, position) => {
  return grid[position.x][position.y];
};

export const updatePropsAt = (grid, position, newProps) => {
  grid[position.x][position.y] = {
    ...grid[position.x][position.y],
    ...newProps,
  };
  return grid;
};

export const erasePropsAt = (grid, position) => {
  grid[position.x][position.y] = {};
  return grid;
};

export const updateGridProps = (grid, newProps) => {
  for (let x = 0; x < gridWidth(grid); x += 1) {
    for (let y = 0; y < gridHeight(grid); y += 1) {
      grid[x][y] = { ...grid[x][y], ...newProps };
    }
  }
  return grid;
};

export const eraseGridProps = (grid) => {
  for (let x = 0; x < gridWidth(grid); x += 1) {
    for (let y = 0; y < gridHeight(grid); y += 1) {
      grid[x][y] = {};
    }
  }
  return grid;
};

export const insertColumn = (grid, defaultProps = {}) => {
  grid.unshift(new Array(gridHeight(grid)));
  if (defaultProps) {
    for (let y = 0; y < gridHeight(grid); y += 1) {
      grid[0][y] = defaultProps;
    }
  }
  return grid;
};

export const appendColumn = (grid, defaultProps = {}) => {
  grid.push(new Array(gridHeight(grid)));
  if (defaultProps) {
    for (let y = 0; y < gridHeight(grid); y += 1) {
      grid[gridWidth(grid) - 1][y] = defaultProps;
    }
  }
  return grid;
};

export const insertRow = (grid, defaultProps = {}) => {
  for (let x = 0; x < gridWidth(grid); x += 1) {
    grid[x].unshift(defaultProps);
  }
  return grid;
};

export const appendRow = (grid, defaultProps = {}) => {
  for (let x = 0; x < gridWidth(grid); x += 1) {
    grid[x].push(defaultProps);
  }
  return grid;
};

export default PositionGrid;
