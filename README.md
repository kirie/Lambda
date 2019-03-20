# AWS Lambda scripts #

**Low Utilization** - 2 part(LowUtilization.js and LowUtilization2.js) lambda function that notifys users who own EC2s with consecutive days of low utilization(less than 10% CPU utilization).  Data is pulled from AWS Trusted Advisor and saved to DynamoDB. The data is diffed every 14 days (user defined), filtered, and updated to only tabulate EC2's with low utilization and put back into DynamoDB.  Low Utilization Instances that have been over the threshold days set will have their instances queried for the tag {Owner: email} and sent an email via SES using a defined template.

##### Prerequisite: #####
 - AWS Trusted Advisor enabled
 - AWS DynamoDB table setup
 - AWS SES with verified email
 - EC2's with the {Owner:email} tag.

**Daily Snapshots** - Takes Daily Snapshots of any EC2 with the {Backup: True} tag. It also adds a {DeleteOn: date} tag to snapshots for daily deletion script.  This script is obsolete with AWS EC2 Lifecycle Management.

**SESTemplate** - Not a full lambda function, but used with LowUtilization.js to create the base email template through AWS CLI.

**SiteKeepCached** - Lambda function to perform a get request on a list of sites.  Checks for 200 status code of all sites in the array.  Used to prevent cache deletion on other hosted platforms.
