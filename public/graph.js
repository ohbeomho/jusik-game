const canvas = document.querySelector("canvas");
const graph = document.querySelector(".graph");
const pointValue = document.querySelector(".point-value");
const points = [];
const context = canvas.getContext("2d");
const f = document.createElement("span");
f.style.fontFamily = "monospace";
f.style.fontSize = "20px";
f.style.position = "absolute";
f.innerText = "a";
document.body.appendChild(f);
const fontWidth = f.offsetWidth;
f.remove();

for (let i = 0; i < array.length; i++) {
  const point = document.createElement("div");
  point.classList.add("point");
  point.dataset.price = array[i];
  points.push(point);
  graph.appendChild(point);
}

function drawGraph() {
  let min = Infinity,
    max = -Infinity;

  for (let price of array) {
    if (price < min) {
      min = price;
    }

    if (price > max) {
      max = price;
    }
  }

  min = Math.floor(min / 1000) * 1000;
  max = Math.ceil(max / 1000) * 1000;

  const a = canvas.width / (array.length + 1);
  let prevPos;

  for (let i = 1; i < array.length + 1; i++) {
    const x = a * i;
    const y = (1 - (array[i - 1] - min) / (max - min)) * (canvas.height - 30) + 15;

    points[i - 1].style.left = `${x + 6}px`;
    points[i - 1].style.top = `${y + 6}px`;

    if (i === 1) {
      prevPos = {
        x,
        y
      };
      continue;
    }

    context.strokeStyle = "white";
    context.beginPath();
    context.moveTo(prevPos.x, prevPos.y);
    context.lineTo(x, y);
    context.stroke();

    prevPos = {
      x,
      y
    };
  }

  context.globalAlpha = 0.5;

  for (let i = min; i <= max; i += 1000) {
    const y = (1 - (i - min) / (max - min)) * (canvas.height - 30) + 15;

    context.strokeStyle = "white";
    context.beginPath();
    context.moveTo(fontWidth * (String(i).length + 1), y);
    context.lineTo(canvas.width, y);
    context.stroke();

    context.fillStyle = "white";
    context.font = "20px monospace";
    context.fillText(i, 0, y + 10);
  }

  context.globalAlpha = 1;
}

function showPointPrice(mouseX, mouseY) {
  const closest = {
    point: null,
    x: Infinity,
    y: Infinity
  };

  for (let point of points) {
    let x = point.style.left;
    let y = point.style.top;
    x = Number(x.substring(0, x.length - 2));
    y = Number(y.substring(0, y.length - 2));

    const dx1 = Math.abs(mouseX - closest.x);
    const dy1 = Math.abs(mouseY - closest.y);
    const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    const dx2 = Math.abs(mouseX - x);
    const dy2 = Math.abs(mouseY - y);
    const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (d2 < d1) {
      closest.point = point;
      closest.x = x;
      closest.y = y;
    }
  }

  pointValue.style.left = closest.x + 8 + "px";
  pointValue.style.top = closest.y + 8 + "px";
  pointValue.innerText = closest.point.dataset.price + "C";
}

function resizeCanvas() {
  canvas.width = window.visualViewport.width / 2;
  canvas.height = canvas.width * (9 / 16);
}

let timeout;

function debounce(f, t) {
  clearTimeout(timeout);
  timeout = setTimeout(f, t);
}

window.addEventListener("resize", () =>
  debounce(() => {
    resizeCanvas();
    drawGraph();
  }, 400)
);

graph.addEventListener("mouseover", () => (pointValue.style.display = "block"));
graph.addEventListener("mousemove", ({ offsetX: x, offsetY: y }) => showPointPrice(x, y));
graph.addEventListener("mouseleave", () => (pointValue.style.display = "none"));

resizeCanvas();
drawGraph();
