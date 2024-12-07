import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

(async () => {
  // Proxy configuration
  const proxyHost = 'prx01.dev.ntt-tx.co.jp';
  const proxyPort = 8080;

  // Target website URL
  const targetUrl = 'https://sed-uehara-graphrag-eastus.openai.azure.com';

  // Proxy URL
  const proxyUrl = `http://${proxyHost}:${proxyPort}`;

  // Create a new Proxy Agent
  const proxyAgent = new HttpsProxyAgent(proxyUrl);

  // Fetch the target website using the proxy agent
    const response = await fetch(targetUrl, { agent: proxyAgent });
    console.log(await response.json())

})();
