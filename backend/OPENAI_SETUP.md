# OpenAI Integration Setup

## Overview
The AI Workflow platform now supports OpenAI ChatGPT models in addition to Qwen models. This allows you to use various GPT models for agent nodes in your workflows.

## Supported Models
- `gpt-3.5-turbo` - Fast and cost-effective
- `gpt-3.5-turbo-16k` - Extended context length
- `gpt-4` - Most capable model  
- `gpt-4-turbo-preview` - Latest GPT-4 with improved performance
- `gpt-4o` - Optimized GPT-4 variant
- `gpt-4o-mini` - Lightweight GPT-4 variant

## Environment Configuration

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-`)

### 2. Configure Environment Variable
Add the following to your `.env` file in the backend directory:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

Replace `your-openai-api-key-here` with your actual OpenAI API key.

### 3. Install Dependencies
Make sure to install the required Python packages:

```bash
cd backend
pip install -r requirements.txt
```

## Usage in Workflows

### Creating an Agent Node with OpenAI
1. Add an Agent node to your workflow
2. Double-click to configure the node
3. Set **Model Type** to "OpenAI ChatGPT"
4. Choose your preferred **OpenAI Model** from the dropdown
5. Enter your **Prompt Template** using Jinja2 syntax
6. Set the **Output Variable Name** for storing the response
7. Save the configuration

### Example Prompt Template
```
You are a helpful assistant. Please analyze the following data:
{{input_data}}

Provide a summary and key insights.
```

## Security Notes
- Keep your OpenAI API key secure and never commit it to version control
- Monitor your OpenAI usage and costs through the OpenAI dashboard
- Consider setting usage limits in your OpenAI account
- The API key should only be accessible to the backend server

## Troubleshooting

### Common Issues
1. **"未配置OPENAI_API_KEY环境变量"**
   - Ensure the environment variable is set correctly
   - Restart the backend server after adding the environment variable

2. **"OpenAI API调用失败"**
   - Check your API key is valid and active
   - Verify you have sufficient credits in your OpenAI account
   - Check your internet connection

3. **Model not available**
   - Ensure you have access to the specific model in your OpenAI account
   - Some models may require different pricing tiers

### Checking Configuration
You can verify your setup by:
1. Creating a simple workflow with an OpenAI agent node
2. Using a basic prompt like "Hello, please respond with 'OpenAI is working'"
3. Executing the workflow and checking the output

## Cost Considerations
- Different models have different pricing (GPT-4 is more expensive than GPT-3.5)
- Monitor your usage through the OpenAI dashboard
- Consider using GPT-3.5-turbo for cost-effective solutions
- Use GPT-4 for more complex reasoning tasks 