const axios = require('axios');

const callLlamaPredict = async (data) => {
  try {
    const response = await axios.post(process.env.python_url, data);
    return response.data;
  } catch (error) {
    throw new Error('Llama inference failed: ' + error.message);
  }
};

module.exports = { callLlamaPredict };