let requestAlreadySent = false; // Flag to check if the request has been sent

// Generates a random hexadecimal string
function generateRandomHex() {
  return Math.floor(Math.random() * 0x10000000000000000).toString(16).padStart(16, '0');
}

// Listener for web requests
chrome.webRequest.onBeforeRequest.addListener(async function (requestDetails) {
  // Check if the request is a POST request and matches a specific URL
  if (requestDetails.method === "POST" && requestDetails.url === "https://secretsanta.cadbury.co.uk/api/confirmOrder" && !requestAlreadySent) {
    requestAlreadySent = true;

    // Check if the request has form data
    if (requestDetails.requestBody.formData) {
      // Generate a random number for PafReferenceId
      const pafReferenceId = Math.floor(Math.random() * 100000000).toString().padStart(7, '0');
      requestDetails.requestBody.formData.PafReferenceId = [pafReferenceId];

      // Prepare the form data for sending
      const formData = requestDetails.requestBody.formData;
      const boundaryRandomPart = '' + Math.random().toString(36).substring(2);
      const boundary = "----WebKitFormBoundary" + boundaryRandomPart;
      const processedFormData = processFormData(formData, boundary);

      // Generate random strings for headers
      const randomString1 = generateRandomHex();
      const randomString2 = generateRandomHex();
      const requestId = "00-" + randomString1 + '-' + randomString2 + "-01";
      const requestChainId = '|' + randomString1 + '.' + randomString2;

      // Send the modified POST request
      const response = await fetch(requestDetails.url, {
        method: "POST",
        headers: generateHeaders(boundary, requestChainId, requestId),
        body: processedFormData
      });

      // Handle the response
      await handleResponse(response);
    }
  }
}, {
  urls: ["<all_urls>"]
}, ["requestBody", "blocking"]);

function processFormData(formData, boundary) {
  const processedDataParts = [];
  for (const key in formData) {
    if (formData.hasOwnProperty(key)) {
      const value = Array.isArray(formData[key]) ? formData[key][0] : formData[key];
      processedDataParts.push('--' + boundary + "\r\nContent-Disposition: form-data; name=\"" + key + "\"\r\n\r\n" + value);
    }
  }
  processedDataParts.push("\r\n--" + boundary + '--');
  return processedDataParts.join("\r\n");
}


function generateHeaders(boundary, requestChainId, requestId) {
  return {
    'Accept': "*/*",
    'Accept-Language': "en-GB,en-US;q=0.9,en;q=0.8",
    'Content-Type': "multipart/form-data; boundary=" + boundary,
    'Request-Id': requestChainId,
    'Sec-CH-UA': "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': "\"Windows\"",
    'Sec-Fetch-Dest': "empty",
    'Sec-Fetch-Mode': "cors",
    'Sec-Fetch-Site': "same-origin",
    'Traceparent': requestId
  };
}

async function handleResponse(response) {
  console.log("Response:", response.status, response.statusText);
  try {
    if (response.status === 200) {
      alert("Order confirmed!\nYou will receive a confirmation email shortly & you may close this page\ndiscord.gg/jadebot");
    } else if (response.status === 400) {
      const errorMessage = await response.text();
      console.log(errorMessage);
      alert("An error has occurred\nError: " + errorMessage + "\nOpen a ticket in the Discord\ndiscord.gg/jadebot");
    }
  } catch (error) {
    console.error('Error handling response:', error);
  } finally {
    requestAlreadySent = false;
  }
}
