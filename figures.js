class Figure {
  shadow = [];
  points = [];
  states = [];
  cur_state = 0;
  max_states = 0;

  is_movable = true;

  is_dropped = false

  color_number = 0

  x = 0;
  y = 0;

  constructor(x, y, states) {
    this.x = x;
    this.y = y;
    this.states = states;
    this.max_states = states.length;
    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      this.points.push({
        x: this.x + state[i].x,
        y: this.y + state[i].y
      });
    }
    this.color_number = (Math.floor(Math.random() * 10000) % (colors.length - 1)) + 1
    // console.log(this.color_number)
  }

  use_state() {

    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      this.points[i].x = this.x + state[i].x;
      this.points[i].y = this.y + state[i].y;
    }
  }

  next_rotate() {
    if (!this.is_movable) return;

    this.clear_state();
    let old_cur = this.cur_state;

    this.cur_state++;
    if (this.cur_state >= this.max_states) {
      this.cur_state = 0;
    }

    let old_points  = this.points;
    this.points = [];

    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      if (this.x + state[i].x < 0 || this.y + state[i].y < 0 
        || this.x + state[i].x > texWidth - 1 || this.y + state[i].y > texHeight - 1
        || this.is_other_wall(this.x + state[i].x, this.y + state[i].y)) {
        this.cur_state = old_cur;
        this.points = old_points;
        return;
      }

      this.points.push({
        x: this.x + state[i].x,
        y: this.y + state[i].y
      });
    }

    if (enable_shadows) {
      this.updateShadow();
    }
  }

  clear_state() {
    if (shadow_switcher) {
      for (let i = 0; i < this.shadow.length; ++i) {
        drawPoint(this.shadow[i], 255);
      }
    }
    for (let i = 0; i < this.points.length; ++i) {
      drawToFieldRGB(this.points[i], 0);
    }
  }

  draw() {
    if (enable_shadows) {
      for (let i = 0; i < this.shadow.length; ++i) {
        drawPoint(this.shadow[i], 192);
      }
    }
    for (let i = 0; i < this.points.length; ++i) {
      drawToFieldRGB(this.points[i], this.color_number);
    }
  }

  move(dx, dy) {
    if (!this.is_movable) return;

    for (let i = 0; i < this.points.length; ++i) {
      if (this.points[i].x + dx < 0 || this.points[i].y + dy < 0 
        || this.points[i].x + dx > texWidth - 1 || this.points[i].y + dy > texHeight - 1
        || this.is_other_wall(this.points[i].x + dx, this.points[i].y + dy)) {

        if (this.is_other_wall(this.points[i].x, this.points[i].y + dy) || this.points[i].y + dy <= 0) {
          this.is_movable = false;
        }
        return;
      }
    }

    this.clear_state()

    this.x += dx
    this.y += dy

    this.use_state()

    if (enable_shadows) {
      this.updateShadow()
    }
  }

  drop() {
    if (this.is_dropped) return
    let dy = texHeight
    for (let i = 0; i < this.points.length; ++i) {
      let px = this.points[i].x
      let py = this.points[i].y
      for (let k = py - 1; k >= 0; --k) {
        if (this.is_other_wall(px, k - 1) || k == 0) {
          if (dy > py - k) {
            dy = py - k 
            // console.log('K: ' + k + ' dy: ' + dy)
          }
        }
      }
    }
    if (dy == texHeight) return

    this.is_dropped = true

    this.clear_state()

    this.y -= dy;

    this.use_state()

    if (enable_shadows) {
      this.updateShadow()
    }
  }

  updateShadow() {
    this.shadow = [];
    for (let i = 0; i < this.points.length; ++i) {
      let px = this.points[i].x;
      let py = this.points[i].y;
      for (let k = py - 1; k >= 0; --k) {
        if (gameField[px + k * texWidth]) break
        this.shadow.push({ x: px, y: k });
      }
    }
  }

  is_other_wall(x, y) {
    return (gameField[x + y * texWidth] && !this.is_point_into(x, y));
  }

  is_point_into(x, y) {
    for (let i = 0; i < this.points.length; ++i) {
      if (this.points[i].x == x && this.points[i].y == y) {
        return true;
      }
    }
    return false;
  }
}

class Cube extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1} ]
    ]);
  }
}

class Stick extends Figure {
  constructor(x, y) {
    super(x - 0.5, y - 0.5, [
      [ {x: -1.5, y: 0.5}, {x: -0.5, y: 0.5}, {x: 0.5, y: 0.5}, {x: 1.5, y: 0.5} ],
      [ {x: 0.5, y: 1.5}, {x: 0.5, y: 0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: -1.5} ],
      [ {x: -1.5, y: -0.5}, {x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 1.5, y: -0.5} ],
      [ {x: -0.5, y: 1.5}, {x: -0.5, y: 0.5}, {x: -0.5, y: -0.5}, {x: -0.5, y: -1.5} ]
    ]);
  }
}

class TLike extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: -1} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0} ]
    ]);
  }
}

class LFstairs extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: 1, y: 0}, {x: 1, y: 1} ],
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 0, y: -1}, {x: 1, y: -1} ],
      [ {x: 0, y: 0}, {x: -1, y: -1}, {x: -1, y: 0}, {x: 0, y: 1} ]
    ]);
  }
}

class RFstairs extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: -1} ],
      [ {x: 0, y: 0}, {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: -1, y: 1}, {x: -1, y: 0}, {x: 0, y: -1} ]
    ]);
  }
}

class RLike extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 0, y: -1} ],
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: -1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: -1, y: -1}, {x: 0, y: 1} ]
    ]);
  }
}

class LLike extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: -1, y: 1}, {x: 0, y: -1} ],
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: -1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: 1, y: -1}, {x: 0, y: 1} ]
    ]);
  }
}

function getRandX() {
  return (Math.floor(Math.random() * 10000) % (texWidth - 4)) + 2;
}

function nextFigure() {
  let next = Math.floor(Math.random() * 6);
  switch (next) {
  case 0:
    cur_figure = new Cube(getRandX(), spawn_Y);
    break;
  case 1:
    cur_figure = new Stick(getRandX(), spawn_Y);
    break;
  case 2:
    cur_figure = new TLike(getRandX(), spawn_Y);
    break;
  case 3:
    cur_figure = new LFstairs(getRandX(), spawn_Y);
    break;
  case 4:
    cur_figure = new RFstairs(getRandX(), spawn_Y);
    break;
  case 5:
    cur_figure = new RLike(getRandX(), spawn_Y);
    break;
  case 6:
    cur_figure = new LLike(getRandX(), spawn_Y);
    break;
  }
}
