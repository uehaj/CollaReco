import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

(async () => {
  // Proxy configuration

  // Target website URL
  const targetUrl = 'https://sed-uehara-graphrag-eastus.openai.azure.com';

  // Fetch the target website using the proxy agent
    const response = await fetch(targetUrl);
    console.log(await response.json())

})();
