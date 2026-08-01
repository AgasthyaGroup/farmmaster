// Fetch Vercel deployment build logs using the deployment ID from the screenshot
// dpl_22nJCQX6A2zrShSrkxFFDcoed7u7
async function getDeploymentLogs() {
  const deploymentId = 'dpl_22nJCQX6A2zrShSrkxFFDcoed7u7';
  
  // Try to get public deployment info (no auth needed for basic info)
  const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 2000));
}

getDeploymentLogs();
