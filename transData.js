const fs = require("fs");
const path = require("path");
const data = require("./mergeDataAll.json");

const res = [];
const testData = [];
const validData = [];

data.forEach((item) => {
  const lines = item["function_content"]
    .split("\n")
    .filter((line) => line !== "");

  const label = [];
  const newLines = [];

  lines.forEach((line, index) => {
    // line 包含 item["coveragdLog"]这个数组中的任意一个时，将其标记为 cover

    if (
      line.toLowerCase().trim().startsWith("log.") ||
      line.toLowerCase().trim().startsWith("logger.")
    ) {
      // 只去掉被 cover的 log
      label.push(`<Line ${index}> ${line.trim()}`);
    } else if (line !== "") {
      // 如果是注释，则不加入 <Line >
      if (
        line.trim().startsWith("//") ||
        line.trim().startsWith("/*") ||
        line.trim().startsWith("*") ||
        line.trim().startsWith("*/")
      ) {
        newLines.push(line.trim());
      }
      // 去掉空行干扰
      newLines.push(`<Line ${index}> ${line.trim()}`);
    }
  });

  // 随机选 10% 的数据作为 test data， 10%的作为 valid data
  if (Math.random() < 0.1) {
    testData.push({
      instruction:
        "Generate complete log statement with an appropriate line index ahead for the given input code. You may need add more than one log statement.",
      input: newLines.join(" "),
      output: label.join(" "),
      type: "test",
    });
    return;
  }
  if (Math.random() < 0.1) {
    validData.push({
      instruction:
        "Generate complete log statement with an appropriate line index ahead for the given input code. You may need add more than one log statement.",
      input: newLines.join(" "),
      output: label.join(" "),
      type: "valid",
    });
    return;
  }

  res.push({
    instruction:
      "Generate complete log statement with an appropriate line index ahead for the given input code. You may need add more than one log statement.",
    input: newLines.join(" "),
    output: label.join(" "),
  });
});

// 输出长度
console.log("train data length: ", res.length);
console.log("test data length: ", testData.length);
console.log("valid data length: ", validData.length);

fs.writeFileSync(
  path.resolve(__dirname, "./data/train.json"),
  JSON.stringify(res, null, 2)
);
fs.writeFileSync(
  path.resolve(__dirname, "./data/test.json"),
  JSON.stringify(testData, null, 2)
);
fs.writeFileSync(
  path.resolve(__dirname, "./data/valid.json"),
  JSON.stringify(validData, null, 2)
);
