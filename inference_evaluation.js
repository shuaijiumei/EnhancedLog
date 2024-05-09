// 定义请求的数据

const { it } = require("node:test");
const testData = require("./data/test.json");
const fs = require("fs");

const data = {
  messages: [
    {
      role: "system",
      content:
        "Generate complete log statement with an appropriate line index ahead for the given input code. You may need add more than one log statement.",
    },
    {
      role: "user",
      content: "",
    },
  ],
  model: "text-davinci-002",
  temperature: 0,
  max_tokens: 512,
};

async function requestBLEU(candidate, reference) {
  const score = await fetch("http://127.0.0.1:5000/bleu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ candidate: candidate, reference: reference }),
  });

  if (score.ok) {
    const responseData = await score.json();
    return responseData;
  } else {
    console.error("API 请求失败:", score.statusText);
    return null;
  }
}

// 调用 OpenAI API 的函数
async function callOpenAI(data) {
  const response = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 替换 YOUR_API_KEY_HERE 为你的 OpenAI API 密钥
      Authorization: "Bearer YOUR_API_KEY_HERE",
    },
    body: JSON.stringify(data),
  });

  // 检查响应是否成功
  if (response.ok) {
    const responseData = await response.json();
    return responseData;
  } else {
    console.error("API 请求失败:", response.statusText);
    return null;
  }
}

function extractParenthesesContent(str) {
  const stack = [];
  const result = [];

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "(") {
      stack.push(i);
    } else if (str[i] === ")") {
      const start = stack.pop();
      if (stack.length === 0) {
        result.push(str.substring(start, i + 1));
      }
    }
  }

  return result.join("");
}

const processLog = (logListStr) => {
  // <Line 2> logger.info(\"About to execute job \" + job.getId()); <Line 5> logger.info(\"Handed off job \" + job.getId() + \" to async executor (retries=\" + job.getRetries() + \")\");
  const logList = logListStr.split(");").filter((item) => item !== "");
  return logList.map((item) => {
    const [line, log] = item + ")".split(">");
    return {
      position: line.trim().replace("<Line", ""),
      level: log.split(".")[1]?.split("(")[0] || "",
      // 正则匹配 （） 里的内容
      content: extractParenthesesContent(log),
    };
  });
};

const logNum = testData.reduce((num, item) => {
  return num + item.output.split(";").filter((item) => item !== "").length;
}, 0);

// 评估结果
const evaluate = (testData) => {
  // <Line 1> logger.info(\">>> Completed process Instances: \");
  const matchResult = testData.reduce(
    (acc, item) => {
      const groundTruth = processLog(item.output);
      const prediction = processLog(item.prediction);
      // 只要 level 对了
      const levelCorrect = groundTruth.filter(
        (item) => prediction.findIndex((p) => p.level === item.level) !== -1
      ).length;
      // 只要 position 对了
      const positionCorrect = groundTruth.filter(
        (item) =>
          prediction.findIndex((p) => p.position === item.position) !== -1
      ).length;

      // 内容硬匹配
      groundTruth.forEach((item) => {
        const pIndex = prediction.findIndex(
          (p) => p.position === item.position && p.level === item.level
        );
        if (pIndex !== -1) {
          if (prediction[pIndex].content === item.content) {
            acc.content += 1;
          }
        }
      });

      return {
        level: acc.level + levelCorrect,
        position: acc.position + positionCorrect,
        content: acc.content,
      };
    },
    {
      level: 0,
      position: 0,
      content: 0,
    }
  );
  console.log("level:", matchResult.level / logNum);
  console.log("position:", matchResult.position / logNum);
  console.log("content:", matchResult.content / logNum);
  console.log("result", matchResult);
};

const calculateBLEU = async (testData) => {
  for (let i = 0; i < testData.length; i++) {
    const item = testData[i];
    const { bleu_score } = await requestBLEU(item.prediction, item.output);
    testData[i].bleu = bleu_score;
  }
};

const main = async () => {
  for (let i = 0; i < testData.length; i++) {
    const item = testData[i];
    data.messages[1].content = item.input;
    const response = await callOpenAI(data);
    // 让 console 有颜色
    console.log(
      "\x1b[36m%s\x1b[0m",
      "API 调用结果:",
      response.choices[0].message.content
    );
    const prediction = response.choices[0].message.content;
    testData[i].prediction = prediction;
  }

  // 存储 testData
  fs.writeFileSync(
    "./data/test_result.json",
    JSON.stringify(
      testData.filter((item) => item.prediction),
      null,
      2
    )
  );
};

const evaluateAll = async () => {
  const prediction_data = require("./data/test_result.json");
  evaluate(prediction_data.filter((item) => item.prediction));
  await calculateBLEU(prediction_data.filter((item) => item.prediction));
  const tatalScore = prediction_data.reduce((BLEUScore, item) => {
    return BLEUScore + item.bleu;
  }, 0);
  console.log("average BLEU score:", tatalScore / logNum);

  fs.writeFileSync(
    "./data/test_evaluation.json",
    JSON.stringify(prediction_data, null, 2)
  );
};

// main();
evaluateAll();
