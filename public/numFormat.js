const units = "만 억 조 경 해 자 양 구 간 정 재 극 항하사 아승기 나유타 불가사의 무량대수 겁 업".split(" ");

function formatNumber(num) {
  for (let i = num.length - 4; i > 0; i -= 4) {
    num = num.substring(0, i) + " " + num.substring(i);
  }

  num = num.split(" ").map(Number);
  for (let i = 0; i < num.length; i++) {
    if (num[i] === 0) {
      num[i] = null;
      continue;
    }

    if (i === num.length - 1) break;

    num[i] = num[i] + units[num.length - i - 2];
  }

  return num.filter((n) => n !== null).join(" ");
}

document
  .querySelectorAll(".credit")
  .forEach((element) => (element.innerText = formatNumber(element.innerText) + "C"));
