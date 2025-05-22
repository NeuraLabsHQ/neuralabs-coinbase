



# AWS Bedrock Model and Region Availability Guide

This guide helps you understand how to query and identify available foundational and inference models in AWS Bedrock, check their ARNs, and determine the regions in which they are supported.


---

## Resources

https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html

## 1. **Understanding Model ARN in AWS Bedrock**

An ARN (Amazon Resource Name) for an inference model in Bedrock typically follows this structure:

```
arn:aws:bedrock:<region>:<account-id>:inference-profile/<model-id>:<version>
```

**Example:**

```
arn:aws:bedrock:us-east-2:559050205657:inference-profile/us.deepseek.r1-v1:0
```

---

## 2. **Different Types of Models in AWS Bedrock**

| Type                                    | Description                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| **Foundational Model (FM)**             | Base model provided by model vendors (e.g., Anthropic, Cohere, Mistral, etc.) |
| **Inference Model / Inference Profile** | Configured version of a foundational model used for performing inference      |


> When using ARN for invoking models, ensure you are using the correct region and account ID. You also need to provide access to the model in your AWS account. Also Note the `boto client` region must match the region of the model you are trying to access.

---

## 3. **Finding Available Bedrock Models**

### Using AWS CLI

To list available foundational models:

```bash
aws bedrock list-foundation-models --region <region>
```

To describe a specific foundational model:

```bash
aws bedrock get-foundation-model --model-identifier <model-id>
```

To list supported model regions:

```bash
aws bedrock list-foundation-models --region <region> \
  --query "modelSummaries[*].{ModelId:modelId,Provider:providerName,ModelArn:modelArn,Region:'<region>'}"
```

### Example:

```bash
aws bedrock list-foundation-models --region us-east-2
```

To find DeepSeek models:

```bash
aws bedrock list-foundation-models --region us-east-1 \
  --query "modelSummaries[?contains(modelId, 'deepseek')]"
```

### Using AWS Console

1. Navigate to **Amazon Bedrock Console**: [https://console.aws.amazon.com/bedrock/](https://console.aws.amazon.com/bedrock/)
2. Choose **Model access** to see available foundational and inference models.
3. Filter by **Region**, **Model Provider**, or **Model Type** (Text, Embedding, etc).

---

## 4. **Checking Region Availability for Specific Models**

Not all Bedrock models are available in all regions.

* Visit: [AWS Regional Services List](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/)
* Select "Amazon Bedrock" and view available model support per region.

Alternatively, use this script (via CLI or SDK):

```bash
for region in $(aws ec2 describe-regions --query 'Regions[*].RegionName' --output text); do
  echo "Checking in region: $region"
  aws bedrock list-foundation-models --region $region \
    --query "modelSummaries[?contains(modelId, 'deepseek')].modelId"
done
```

---

## 5. **Identifying Inference Models**

Inference models are often specific deployments/configurations of foundational models.
You can:

* Check in the Console under **Model access > Inference models**
* Use CloudTrail logs or Resource Explorer to find used inference profiles

To query an existing ARN:

```bash
aws bedrock get-model-inference-profile --inference-profile-identifier <inference-profile-id>
```

> Note: You must use an API or SDK that supports this operation (not all are public as of early 2025).

---

## 6. **Common Errors and How to Debug**

### Error:

```text
ValidationException: The provided model identifier is invalid.
```

### Causes:

* The model is not available in the selected region.
* Incorrect use of full ARN instead of `modelId` in `invoke_model_with_response_stream`.

### Fix:

1. Confirm the region where the model is available.
2. Use only the `modelId` in your API call, **not** the full ARN.

### Correct usage:

```python
response = bedrock_runtime.invoke_model_with_response_stream(
    modelId="deepseek.r1-v1:0",
    body=json.dumps(request_body),
    contentType="application/json",
    accept="application/json"
)
```

---

### Error:

```text
ValidationException: Invocation of model ID deepseek.r1-v1:0 with on-demand throughput isn’t supported. Retry your request with the ID or ARN of an inference profile that contains this model.
```

### Cause:

* You're trying to invoke a foundational model directly using on-demand throughput, but this model requires a **preconfigured inference profile**.

### Fix:

* Use the ARN of a **valid inference profile** (e.g. `arn:aws:bedrock:<region>:<account-id>:inference-profile/<profile-id>`).

### How to find available inference profiles:

```bash
aws bedrock list-model-inference-profiles --region us-east-1
```

### Example usage with ARN:

```python
response = bedrock_runtime.invoke_model_with_response_stream(
    modelId="arn:aws:bedrock:us-east-2:559050205657:inference-profile/us.deepseek.r1-v1:0",
    body=json.dumps(request_body),
    contentType="application/json",
    accept="application/json"
)
```

---

## 7. **Documentation and Resources**

* [Amazon Bedrock Developer Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/)
* [AWS Bedrock API Reference](https://docs.aws.amazon.com/bedrock/latest/APIReference/Welcome.html)
* [Foundational Models list](https://aws.amazon.com/bedrock/features/#Model_Providers)

---

## 8. **Common Model Providers in AWS Bedrock**

| Provider  | Example Model IDs                |
| --------- | -------------------------------- |
| Anthropic | anthropic.claude-v2              |
| AI21 Labs | ai21.j2-ultra-v1                 |
| Cohere    | cohere.command-text-v14          |
| Stability | stability.stable-diffusion-v1    |
| Meta      | meta.llama2-13b-chat-v1          |
| Mistral   | mistral.mistral-7b-instruct-v0:1 |
| DeepSeek  | deepseek.r1-v1:0                 |

---

## 9. **Example ARN Breakdown**

**ARN:**

```
arn:aws:bedrock:us-east-2:559050205657:inference-profile/us.deepseek.r1-v1:0
```

| Part               | Value               |
| ------------------ | ------------------- |
| Service            | bedrock             |
| Region             | us-east-2           |
| Account ID         | 559050205657        |
| Resource Type      | inference-profile   |
| Model ID & Version | us.deepseek.r1-v1:0 |

> `Account ID` is the AWS account ID. Do not use full ARN when calling runtime APIs unless the model requires an inference profile ARN.

---

For further automation, consider using Boto3 SDK (Python) to script listing and querying models programmatically.
