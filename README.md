# AWS Lambda scripts #

**Low Utilization** - This is a 2 part lambda function that notifys users who own EC2s with set days of consecutive low utilization(less than 10% CPU utilization).  The data is pulled from AWS Trusted Advisor and saved to DynamoDB. The data is diffed every 14 days (user defined), filtered, and updated to only tabulate EC2's with low utilization.  Low Utilization Instances that have been over the threshold days set will have their instances looked up for the Tag of {Owner: email} and sent an email via SES using a defined template.

##### Prerequisite: #####
 - AWS Trusted Advisor enabled
 - AWS DynamoDB table setup
 - AWS SES with verified email
 - EC2's with the {Owner:email} tag.
