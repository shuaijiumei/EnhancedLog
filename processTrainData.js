const data = require("./mergeDataAll.json");

const fs = require("fs");
const trainFormate = [];

data.forEach((item) => {
  const lines = item.function_function_content.split("\n");
  

  trainFormate.push({
    instruction:
      "Generate a complete log statement with an appropriate line index ahead for the given input code.",
    input: item.function_without_logs,
    output: item.output,
  });
});
