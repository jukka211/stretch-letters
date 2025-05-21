let sliderCols, sliderRows;
let cols = 2, rows = 2;
let scaleCols = [], scaleRows = [];
let letters = [];

let activeColHandle = null;
let activeRowHandle = null;
let colSumBefore, colGroupSum, totalColSum;
let rowSumBefore, rowGroupSum, totalRowSum;

const PANEL_H = 50;
const HANDLE_SIZE = 12;
const MIN_FACTOR = 0.1;

let canvasElem;

function setup() {
  canvasElem = createCanvas(windowWidth, windowHeight);
  noStroke();

  // sliders
  sliderCols = createSlider(1, 10, cols, 1);
  sliderRows = createSlider(1, 10, rows, 1);
  sliderCols.style('accent-color', '#fff');
  sliderRows.style('accent-color', '#fff');

  initScales();

  // disable default touch gestures
  canvasElem.elt.style.touchAction = 'none';
  // pointer events
  canvasElem.elt.addEventListener('pointerdown', e => {
    const { x, y } = toCanvasCoords(e);
    handlePress(x, y);
    e.preventDefault();
  }, { passive: false });
  canvasElem.elt.addEventListener('pointermove', e => {
    const { x, y } = toCanvasCoords(e);
    if (activeColHandle !== null || activeRowHandle !== null) {
      handleDrag(x, y);
      e.preventDefault();
    }
  }, { passive: false });
  canvasElem.elt.addEventListener('pointerup', e => {
    activeColHandle = activeRowHandle = null;
    e.preventDefault();
  }, { passive: false });
  canvasElem.elt.addEventListener('pointercancel', e => {
    activeColHandle = activeRowHandle = null;
    e.preventDefault();
  }, { passive: false });
}

function toCanvasCoords(e) {
  const rect = canvasElem.elt.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function initScales() {
  cols = sliderCols.value();
  rows = sliderRows.value();
  scaleCols = Array(cols).fill(1);
  scaleRows = Array(rows).fill(1);

  letters = [];
  let code = 65;
  for (let i = 0; i < cols; i++) {
    letters[i] = [];
    for (let j = 0; j < rows; j++) {
      letters[i][j] = char(code);
      code = code < 90 ? code + 1 : 65;
    }
  }
}

function draw() {
  background(255);

  let gridW = width;
  let gridH = height - PANEL_H;

  // re-init if sliders changed
  if (sliderCols.value() !== cols || sliderRows.value() !== rows) {
    initScales();
  }

  // position sliders
  sliderCols.position(20, gridH + 20);
  sliderCols.style('width', '120px');
  sliderRows.position(180, gridH + 20);
  sliderRows.style('width', '120px');

  // compute sums
  totalColSum = scaleCols.reduce((a,b)=>a+b,0);
  totalRowSum = scaleRows.reduce((a,b)=>a+b,0);

  // compute grid positions
  let xCum = 0, yCum = 0;
  let xPos = [], yPos = [];
  for (let i=0; i<cols; i++) {
    xPos[i] = xCum/totalColSum*gridW;
    xCum += scaleCols[i];
  }
  xPos[cols] = gridW;
  for (let j=0; j<rows; j++) {
    yPos[j] = yCum/totalRowSum*gridH;
    yCum += scaleRows[j];
  }
  yPos[rows] = gridH;

  // draw cells
  fill(0);
  for (let i=0; i<cols; i++){
    for (let j=0; j<rows; j++){
      rect(xPos[i], yPos[j],
           xPos[i+1]-xPos[i],
           yPos[j+1]-yPos[j]);
    }
  }

  // draw handles
  fill(255);
  noStroke();
  for (let i=1; i<cols; i++){
    let hx = xPos[i];
    rect(hx - HANDLE_SIZE/2, gridH/2 - HANDLE_SIZE,
         HANDLE_SIZE, HANDLE_SIZE*2, 4);
  }
  for (let j=1; j<rows; j++){
    let hy = yPos[j];
    rect(gridW/2 - HANDLE_SIZE, hy - HANDLE_SIZE/2,
         HANDLE_SIZE*2, HANDLE_SIZE, 4);
  }

  // draw letters
  textFont('Arial');
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  fill(255);
  const BASE = 100;
  textSize(BASE);
  for (let i=0; i<cols; i++){
    for (let j=0; j<rows; j++){
      let x = xPos[i], y = yPos[j];
      let w = xPos[i+1]-x, h = yPos[j+1]-y;
      let ch = letters[i][j];
      let glyphW = textWidth(ch);
      let glyphH = textAscent()+textDescent();
      let sx = w/glyphW, sy = h/glyphH;
      push();
        translate(x+w/2, y+h/2);
        scale(sx, sy);
        text(ch, 0, 0);
      pop();
    }
  }

  // bottom panel
  fill(0);
  noStroke();
  rect(0, gridH, width, PANEL_H);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`Cols: ${cols}`, 20, gridH+12);
  text(`Rows: ${rows}`, 180, gridH+12);
}

function handlePress(mx, my){
  let gridW = width, gridH = height - PANEL_H;
  let xCum=0, yCum=0;
  let xPos=[], yPos=[];
  for(let i=0;i<cols;i++){
    xPos[i] = xCum/totalColSum*gridW; xCum+=scaleCols[i];
  }
  xPos[cols]=gridW;
  for(let j=0;j<rows;j++){
    yPos[j] = yCum/totalRowSum*gridH; yCum+=scaleRows[j];
  }
  yPos[rows]=gridH;

  // column handles
  for(let i=1;i<cols;i++){
    if(abs(mx-xPos[i])<HANDLE_SIZE && my<gridH){
      activeColHandle=i-1;
      colSumBefore = scaleCols.slice(0,i-1).reduce((a,b)=>a+b,0);
      colGroupSum = scaleCols[i-1]+scaleCols[i];
      totalColSum = scaleCols.reduce((a,b)=>a+b,0);
      return;
    }
  }
  // row handles
  for(let j=1;j<rows;j++){
    if(abs(my-yPos[j])<HANDLE_SIZE && my<gridH){
      activeRowHandle=j-1;
      rowSumBefore = scaleRows.slice(0,j-1).reduce((a,b)=>a+b,0);
      rowGroupSum = scaleRows[j-1]+scaleRows[j];
      totalRowSum = scaleRows.reduce((a,b)=>a+b,0);
      return;
    }
  }
  // cycle letter
  if(my<gridH){
    let iHit=-1, jHit=-1;
    for(let i=0;i<cols;i++){
      if(mx>=xPos[i]&&mx<xPos[i+1]) iHit=i;
    }
    for(let j=0;j<rows;j++){
      if(my>=yPos[j]&&my<yPos[j+1]) jHit=j;
    }
    if(iHit>=0&&jHit>=0){
      let code = letters[iHit][jHit].charCodeAt(0);
      letters[iHit][jHit] = char(code<90?code+1:65);
    }
  }
}

function handleDrag(mx, my){
  let gridW = width, gridH = height - PANEL_H;
  if(activeColHandle!==null){
    let desired = constrain((mx/gridW)*totalColSum,
                     colSumBefore+MIN_FACTOR,
                     colSumBefore+colGroupSum-MIN_FACTOR);
    let newA = desired-colSumBefore,
        newB = colGroupSum-newA;
    scaleCols[activeColHandle]=newA;
    scaleCols[activeColHandle+1]=newB;
  } else if(activeRowHandle!==null){
    let desired = constrain((my/gridH)*totalRowSum,
                     rowSumBefore+MIN_FACTOR,
                     rowSumBefore+rowGroupSum-MIN_FACTOR);
    let newA = desired-rowSumBefore,
        newB = rowGroupSum-newA;
    scaleRows[activeRowHandle]=newA;
    scaleRows[activeRowHandle+1]=newB;
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}
