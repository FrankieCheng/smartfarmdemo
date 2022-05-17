import { aws_iot as iot } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SitewiseRuleRealProps {
    deviceId?: number;
    deviceName?: string;
    roleArn: string;
    topic: string;
    ruleName: string;
}

export class SitewiseRuleReal extends Construct {
constructor(scope: Construct, id: string, props: SitewiseRuleRealProps) {
    super(scope, id);
    new iot.CfnTopicRule(this, id, {
        topicRulePayload: {
          actions: [{
            iotSiteWise: {
              putAssetPropertyValueEntries: [{
                propertyValues: [{
                  timestamp: {
                    timeInSeconds: '${time_to_epoch(get((SELECT VALUE ts FROM payload.vals WHERE id = \'' + props.deviceId + '\'),0), "yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'")/1000}',
                  },
                  value: {
                    doubleValue: '${get((SELECT VALUE val FROM payload.vals WHERE id = \'' + props.deviceId + '\'),0)}',
                  },
                }],
      
                propertyAlias: '/smartfarmsensor/' + props.deviceName + '/val',
              }],
              roleArn: props.roleArn,
            },
          }],
          awsIotSqlVersion: '2016-03-23',
          sql: "select * from \'" + props.topic + "\'",
          description: 'description',
          errorAction: {
            republish: {
              roleArn: props.roleArn,
              topic: 'errormessage',
              qos: 0,
            },
          },
          ruleDisabled: false,
        },
        ruleName : props.ruleName
      });
}
}