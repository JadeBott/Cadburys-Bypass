let requestSent = false;

function generateRandomHex() {
  return Math.floor(Math.random() * 0xFFFFFFFFFFFFFFFF).toString(16).padStart(16, '0');
}

chrome.webRequest.onBeforeRequest.addListener(
  async function(details) {

    if (
      details.method === "POST" &&
      details.url === "https://secretsanta.cadbury.co.uk/api/confirmOrder" &&
      !requestSent
    ) {

      requestSent = true;

      if (details.requestBody.formData) {

        const randomString = Math.floor(Math.random() * 100000000).toString().padStart(7, '0');
        details.requestBody.formData.PafReferenceId = [randomString];

        const formData = details.requestBody.formData;

        const formKey = `${Math.random().toString(36).substring(2)}`

        const boundary = `----WebKitFormBoundary${formKey}`;

        const processedKeys = new Set();

        const requestBody = Object.keys(formData)
          .map((key) => {

            if (!processedKeys.has(key)) {
              processedKeys.add(key);

              const field = Array.isArray(formData[key]) ? formData[key][0] : formData[key];
              return `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${field}`;
            }
            return null;
          })
          .filter((item) => item !== null)
          .join('\r\n') + `\r\n--${boundary}--`;

        const traceIdValue = generateRandomHex() + generateRandomHex();
        const parentIdValue = generateRandomHex();

        const randomTraceContextFormat1 = `00-${traceIdValue}-${parentIdValue}-01`;

        const randomTraceContextFormat2 = `|${traceIdValue}.${parentIdValue}`;

        const response = await fetch(details.url, {
          "method": "POST",
          "headers": {
            "accept": "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": `multipart/form-data; boundary=----WebKitFormBoundary${formKey}`,
            "request-id": `${randomTraceContextFormat2}`,
            "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "traceparent": `${randomTraceContextFormat1}`,
          },
          "body": `${requestBody}`,
        });

        console.log("Response:", response.status, response.statusText)

        try {
          if(response.status === 200) {
            alert("Order confirmed!\nYou will receive a confirmation email shortly & you may close this page\ndiscord.gg/jadebot");
          } else if (response.status === 400) {
            const html = await response.text()
            console.log(html)
            alert(`An error has occurred\nError: ${html}\nOpen a ticket in the Discord\ndiscord.gg/jadebot`);
          }
        } finally {
          requestSent = false;
        }
      }
    }

  },
  {urls: ["<all_urls>"]},
  ["requestBody", "blocking"]
);
