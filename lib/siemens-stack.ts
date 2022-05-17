import { SitewiseRuleBoolean } from './SitewiseRuleBoolean';
import { SitewiseRuleReal } from './SitewiseRuleReal';
import { SitewiseRuleInteger } from './SitewiseRuleInteger';
import { Duration, Stack, StackProps, CfnParameter, CfnOutput, Fn, RemovalPolicy, Aws } from 'aws-cdk-lib';
import * as iotsitewise from 'aws-cdk-lib/aws-iotsitewise';
import { aws_iot as iot } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { aws_kinesisfirehose as kinesisfirehose } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as glue from 'aws-cdk-lib/aws-glue';
import { custom_resources as cr } from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iotevents from 'aws-cdk-lib/aws-iotevents';
import { Condition } from 'aws-cdk-lib/aws-stepfunctions';
// import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
// import { PolicyDocument } from 'aws-cdk-lib/aws-iam';

export class SiemensStack extends Stack {
  public readonly bucketName: string;
  constructor(scope: Construct, id: string, props?: StackProps) {

    super(scope, id, props);

    const smartFarmTopicParameter = new CfnParameter(this, "smartFarmTopic", {
      type: "String",
      default: 'smartfarm',
      description: "The MQTT topic for IoT Devices."});

    const smartFarmTopic = smartFarmTopicParameter.valueAsString;

    const ioTSitewiseAllowPolicy = new iam.PolicyStatement({
      resources: ['*'],
      actions: ["sns:Publish",
      "firehose:PutRecord",
      "lambda:InvokeFunction",
      "sqs:SendMessage",
      "firehose:PutRecordBatch",
      "iot:Publish",
      "iotevents:BatchPutMessage",
      "iotsitewise:BatchPutAssetPropertyValue"],
    });

    const ioTSiteWiseAccessForIoTEventsRole = new iam.Role(this, 'IoTSiteWiseAccessForIoTEvents-role-', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('iot.amazonaws.com'),
        new iam.ServicePrincipal('iotevents.amazonaws.com')
      ),
    });
    ioTSiteWiseAccessForIoTEventsRole.addToPolicy(ioTSitewiseAllowPolicy);


    const sensorsWithDataTypeDouble = new iotsitewise.CfnAssetModel(this, 'sensorsWithDataTypeDouble', {
      assetModelName: 'Siemens Sensors With Datatype Double Demo-LJbQpihcaa0O',
      assetModelDescription: 'Sensors With Datatype Double',

      assetModelProperties: [{
        dataType: 'STRING',
        logicalId: 'sensorAttribute',
        name: 'sensor',
        type: {
          typeName: 'Attribute',
          // the properties below are optional
          attribute: {
            defaultValue: 'sensor',
          },
        },
      },{
        dataType: 'DOUBLE',
        logicalId: 'soilTempNormal',
        name: 'SoilTempNormal',
        type: {
          typeName: 'Attribute',
          // the properties below are optional
          attribute: {
            defaultValue: '25',
          },
        },
      },{
        dataType: 'DOUBLE',
        logicalId: 'soilHumiNormal',
        name: 'SoilHumiNormal',
        type: {
          typeName: 'Attribute',
          // the properties below are optional
          attribute: {
            defaultValue: '15',
          },
        },
      },{
        dataType: 'STRING',
        logicalId: 'sensorMeasurementId',
        name: 'id',
        type: {
          typeName: 'Measurement'
        },
      },{
        dataType: 'INTEGER',
        logicalId: 'sensorMeasurementQc',
        name: 'qc',
        type: {
          typeName: 'Measurement',
        },
      },{
        dataType: 'DOUBLE',
        logicalId: 'sensorMeasurementVal',
        name: 'val',
        type: {
          typeName: 'Measurement',
        },
      },{
        name: 'Max Val',
        dataType: 'DOUBLE',
        logicalId: 'sensorMetricMaxVal',
        type: {
          typeName: 'Metric',
          metric: {
            expression: 'max(val)',
            variables: [{
              name: 'val',
              value: {
                propertyLogicalId: 'sensorMeasurementVal'
              },
            }],
            window: {
              tumbling: {
                interval: '1m',
              },
            },
          }
        }
      },{
        name: 'Min Val',
        dataType: 'DOUBLE',
        logicalId: 'sensorMetricMinVal',
        type: {
          typeName: 'Metric',
          metric: {
            expression: 'min(val)',
            variables: [{
              name: 'val',
              value: {
                propertyLogicalId: 'sensorMeasurementVal'
              },
            }],
            window: {
              tumbling: {
                interval: '1m',
              },
            },
          }
        }
      },{
        name: 'AVG Val',
        dataType: 'DOUBLE',
        logicalId: 'sensorMetricAvgVal',
        type: {
          typeName: 'Metric',
          metric: {
            expression: 'avg(val)',
            variables: [{
              name: 'val',
              value: {
                propertyLogicalId: 'sensorMeasurementVal'
              },
            }],
            window: {
              tumbling: {
                interval: '1m',
              },
            },
          }
        }
      },
      ],
    });

    const sensorsWithDataTypeInteger = new iotsitewise.CfnAssetModel(this, 'sensorsWithDataTypeInteger', {
      assetModelName: 'Siemens Sensors With Datatype Integer Demo-LJbQpihcaa0O',
      assetModelDescription: 'Sensors With Datatype Integer',

      assetModelProperties: [{
        dataType: 'STRING',
        logicalId: 'sensorAttribute',
        name: 'sensor',
        type: {
          typeName: 'Attribute',
          // the properties below are optional
          attribute: {
            defaultValue: 'sensor',
          },
        },
      },{
        dataType: 'STRING',
        logicalId: 'sensorMeasurementId',
        name: 'id',
        type: {
          typeName: 'Measurement'
        },
      },{
        dataType: 'INTEGER',
        logicalId: 'sensorMeasurementQc',
        name: 'qc',
        type: {
          typeName: 'Measurement',
        },
      },{
        dataType: 'INTEGER',
        logicalId: 'sensorMeasurementVal',
        name: 'val',
        type: {
          typeName: 'Measurement',
        },
      }],
    });

    const sensorsWithDataTypeBoolean = new iotsitewise.CfnAssetModel(this, 'sensorsWithDataTypeBoolean', {
      assetModelName: 'Siemens Sensors With Datatype Boolean Demo-LJbQpihcaa0O',
      assetModelDescription: 'Sensors With Datatype Boolean',
      //assetModelProperties: sensorsWithDataTypeDouble.assetModelProperties,
      assetModelProperties: [{
        dataType: 'STRING',
        logicalId: 'sensorAttribute',
        name: 'sensor',
        type: {
          typeName: 'Attribute',
          // the properties below are optional
          attribute: {
            defaultValue: 'sensor',
          },
        },
      },{
        dataType: 'STRING',
        logicalId: 'sensorMeasurementId',
        name: 'id',
        type: {
          typeName: 'Measurement'
        },
      },{
        dataType: 'INTEGER',
        logicalId: 'sensorMeasurementQc',
        name: 'qc',
        type: {
          typeName: 'Measurement',
        },
      },{
        dataType: 'BOOLEAN',
        logicalId: 'sensorMeasurementVal',
        name: 'val',
        type: {
          typeName: 'Measurement',
        },
      }],
    });

    const smartFarmModel = new iotsitewise.CfnAssetModel(this, 'smartFarmModel', {
      assetModelName: 'Smart Farm Demo-LJbQpihcaa0O',
      assetModelDescription: 'Smart Farm Logic layer without a specific measurement.',

      assetModelHierarchies: [{
        childAssetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
        logicalId: 'modelBooleanId',
        name: 'Sensors-Bool',
      },{
        childAssetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
        logicalId: 'modelDoubleId',
        name: 'Sensors-Double',
      },{
        childAssetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
        logicalId: 'modelIntegerId',
        name: 'Sensors-Int',
      },],
    });

    const soilTempAsset = new iotsitewise.CfnAsset(this, 'soilTempAsset', {
      assetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
      assetName: 'SoilTemp Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/SoilTemp/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/SoilTemp/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/SoilTemp/val',
        notificationState: 'DISABLED',
      }],
    });

    const autoLightTimeAsset = new iotsitewise.CfnAsset(this, 'autoLightTimeAsset', {
      assetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
      assetName: 'AutoLightTime Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/AutoLightTime/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/AutoLightTime/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/AutoLightTime/val',
        notificationState: 'DISABLED',
      }],
    });

    const lightTimeAsset = new iotsitewise.CfnAsset(this, 'lightTimeAsset', {
      assetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
      assetName: 'LightTime Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/LightTime/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/LightTime/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/LightTime/val',
        notificationState: 'DISABLED',
      }],
    });

    const airHumidityAsset = new iotsitewise.CfnAsset(this, 'airHumidityAsset', {
      assetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
      assetName: 'AirHumidity Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/AirHumidity/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/AirHumidity/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/AirHumidity/val',
        notificationState: 'DISABLED',
      }],
    });

    const soilHumiAsset = new iotsitewise.CfnAsset(this, 'soilHumiAsset', {
      assetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
      assetName: 'SoilHumi Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/SoilHumi/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/SoilHumi/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/SoilHumi/val',
        notificationState: 'DISABLED',
      }],
    });

    const airTempAsset = new iotsitewise.CfnAsset(this, 'airTempAsset', {
      assetModelId: sensorsWithDataTypeDouble.attrAssetModelId,
      assetName: 'AirTemp Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/AirTemp/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/AirTemp/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/AirTemp/val',
        notificationState: 'DISABLED',
      }],
    });

    const pumpManuAsset = new iotsitewise.CfnAsset(this, 'pumpManuAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'PumpManu Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/PumpManu/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/PumpManu/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/PumpManu/val',
        notificationState: 'DISABLED',
      }],
    });

    const pumpAsset = new iotsitewise.CfnAsset(this, 'pumpAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'Pump Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/Pump/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/Pump/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/Pump/val',
        notificationState: 'DISABLED',
      }],
    });

    const whiteLightAsset = new iotsitewise.CfnAsset(this, 'whiteLightAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'WhiteLight Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/WhiteLight/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/WhiteLight/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/WhiteLight/val',
        notificationState: 'DISABLED',
      }],
    });

    const heatingManuAsset = new iotsitewise.CfnAsset(this, 'heatingManuAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'HeatingManu Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/HeatingManu/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/HeatingManu/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/HeatingManu/val',
        notificationState: 'DISABLED',
      }],
    });

    const heatingAsset = new iotsitewise.CfnAsset(this, 'heatingAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'Heating Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/Heating/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/Heating/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/Heating/val',
        notificationState: 'DISABLED',
      }],
    });

    const fanManuAsset = new iotsitewise.CfnAsset(this, 'fanManuAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'FanManu Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/FanManu/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/FanManu/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/FanManu/val',
        notificationState: 'DISABLED',
      }],
    });

    const blueLightManuAsset = new iotsitewise.CfnAsset(this, 'blueLightManuAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'BlueLightManu Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/BlueLightManu/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/BlueLightManu/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/BlueLightManu/val',
        notificationState: 'DISABLED',
      }],
    });

    const blueLightAsset = new iotsitewise.CfnAsset(this, 'blueLightAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'BlueLight Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/BlueLight/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/BlueLight/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/BlueLight/val',
        notificationState: 'DISABLED',
      }],
    });

    const longDayAsset = new iotsitewise.CfnAsset(this, 'longDayAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'LongDay Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/LongDay/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/LongDay/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/LongDay/val',
        notificationState: 'DISABLED',
      }],
    });

    const fanAsset = new iotsitewise.CfnAsset(this, 'fanAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'Fan Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/Fan/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/Fan/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/Fan/val',
        notificationState: 'DISABLED',
      }],
    });

    const redLightManuAsset = new iotsitewise.CfnAsset(this, 'redLightManuAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'RedLightManu Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/RedLightManu/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/RedLightManu/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/RedLightManu/val',
        notificationState: 'DISABLED',
      }],
    });


    const redLightAsset = new iotsitewise.CfnAsset(this, 'redLightAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'RedLight Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '///RedLight/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/RedLight/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/RedLight/val',
        notificationState: 'DISABLED',
      }],
    });
    
    const shortDayAsset = new iotsitewise.CfnAsset(this, 'shortDayAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'ShortDay Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/ShortDay/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/ShortDay/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/ShortDay/val',
        notificationState: 'DISABLED',
      }],
    });

    const whiteLightManuAsset = new iotsitewise.CfnAsset(this, 'whiteLightManuAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'WhiteLightManu Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/WhiteLightManu/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/WhiteLightManu/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/WhiteLightManu/val',
        notificationState: 'DISABLED',
      }],
    });

    const lightHalfAutoAsset = new iotsitewise.CfnAsset(this, 'lightHalfAutoAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'LightHalfAuto Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/LightHalfAuto/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/LightHalfAuto/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/LightHalfAuto/val',
        notificationState: 'DISABLED',
      }],
    });

    const lightManualStopAsset = new iotsitewise.CfnAsset(this, 'lightManualStopAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'LightManualStop Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/LightManualStop/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/LightManualStop/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/LightManualStop/val',
        notificationState: 'DISABLED',
      }],
    });

    const setAgeStartAsset = new iotsitewise.CfnAsset(this, 'setAgeStartAsset', {
      assetModelId: sensorsWithDataTypeBoolean.attrAssetModelId,
      assetName: 'SetAgeStart Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/SetAgeStart/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/SetAgeStart/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/SetAgeStart/val',
        notificationState: 'DISABLED',
      }],
    });

    const yearAsset = new iotsitewise.CfnAsset(this, 'yearAsset', {
      assetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
      assetName: 'Year Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/Year/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/Year/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/Year/val',
        notificationState: 'DISABLED',
      }],
    });

    const monthAsset = new iotsitewise.CfnAsset(this, 'monthAsset', {
      assetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
      assetName: 'Month Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/Month/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/Month/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/Month/val',
        notificationState: 'DISABLED',
      }],
    });

    const dayAsset = new iotsitewise.CfnAsset(this, 'dayAsset', {
      assetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
      assetName: 'DAY Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/DAY/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/DAY/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/DAY/val',
        notificationState: 'DISABLED',
      }],
    });

    const ageDaysAsset = new iotsitewise.CfnAsset(this, 'ageDaysAsset', {
      assetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
      assetName: 'AgeDays Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/AgeDays/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/AgeDays/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/AgeDays/val',
        notificationState: 'DISABLED',
      }],
    });

    const cO2Asset = new iotsitewise.CfnAsset(this, 'cO2Asset', {
      assetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
      assetName: 'CO2 Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/CO2/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/CO2/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/CO2/val',
        notificationState: 'DISABLED',
      }],
    });

    const illumination = new iotsitewise.CfnAsset(this, 'illumination', {
      assetModelId: sensorsWithDataTypeInteger.attrAssetModelId,
      assetName: 'Illumination Demo-LJbQpihcaa0O',
      assetProperties: [{
        logicalId: 'sensorMeasurementId',
        alias: '/smartfarmsensor/Illumination/id',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementQc',
        alias: '/smartfarmsensor/Illumination/qc',
        notificationState: 'DISABLED',
      },{
        logicalId: 'sensorMeasurementVal',
        alias: '/smartfarmsensor/Illumination/val',
        notificationState: 'DISABLED',
      }],
    });

    const smartFarmAsset = new iotsitewise.CfnAsset(this, 'Smart Farm', {
      assetModelId: smartFarmModel.attrAssetModelId,
      assetName: 'Smart_Farm Demo-LJbQpihcaa0O',
      assetHierarchies: [{
        logicalId: 'modelDoubleId',
        childAssetId: lightTimeAsset.attrAssetId
      },{
        logicalId: 'modelDoubleId',
        childAssetId: airHumidityAsset.attrAssetId
      },{
        logicalId: 'modelDoubleId',
        childAssetId: airTempAsset.attrAssetId
      },{
        logicalId: 'modelDoubleId',
        childAssetId: autoLightTimeAsset.attrAssetId
      },{
        logicalId: 'modelDoubleId',
        childAssetId: soilTempAsset.attrAssetId
      },{
        logicalId: 'modelDoubleId',
        childAssetId: soilHumiAsset.attrAssetId
      },{
        logicalId: 'modelIntegerId',
        childAssetId: illumination.attrAssetId
      },{
        logicalId: 'modelIntegerId',
        childAssetId: cO2Asset.attrAssetId
      },{
        logicalId: 'modelIntegerId',
        childAssetId: yearAsset.attrAssetId
      },{
        logicalId: 'modelIntegerId',
        childAssetId: ageDaysAsset.attrAssetId
      },{
        logicalId: 'modelIntegerId',
        childAssetId: monthAsset.attrAssetId
      },{
        logicalId: 'modelIntegerId',
        childAssetId: dayAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: pumpManuAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: whiteLightAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: heatingManuAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: heatingAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: fanManuAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: blueLightManuAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: redLightAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: setAgeStartAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: lightManualStopAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: pumpAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: blueLightAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: lightHalfAutoAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: whiteLightManuAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: shortDayAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: redLightManuAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: fanAsset.attrAssetId
      },{
        logicalId: 'modelBooleanId',
        childAssetId: longDayAsset.attrAssetId
      }],
    });

    const sensorsWithDataTypeDoubleAssetModelId = sensorsWithDataTypeDouble.attrAssetModelId;

    //desribe the asset model, get the value for update.
    const sensorsWithDataTypeDoubleDescribe = new cr.AwsCustomResource(this, 'describeAssetModel', {
      onCreate: {
        service: 'IoTSiteWise',
        action: 'describeAssetModel',
        physicalResourceId: cr.PhysicalResourceId.fromResponse('assetModelArn'),
        parameters: {
          "assetModelId": sensorsWithDataTypeDoubleAssetModelId
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });
    sensorsWithDataTypeDoubleDescribe.node.addDependency(sensorsWithDataTypeDouble);
    
    const maxValueId = sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.id');
    const soilTempNormalId = sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.1.id');
    const soilHumiNormalId = sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.2.id');
    
    // new CfnOutput(this, 'maxValueId', { value: maxValueId });
    // new CfnOutput(this, 'soilTempNormalId', { value: soilTempNormalId });

    const updateAssetModelDouble = new cr.AwsCustomResource(this, 'updateAssetModelDouble', {
      onCreate: {
        service: 'IoTSiteWise',
        action: 'updateAssetModel',
        physicalResourceId: cr.PhysicalResourceId.of(sensorsWithDataTypeDouble.attrAssetModelId),
        parameters: {
          assetModelId: sensorsWithDataTypeDouble.attrAssetModelId, /* required */
          assetModelName: sensorsWithDataTypeDouble.assetModelName, /* required */
          assetModelProperties: [{
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.0.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.0.name'),
              dataType: "STRING",
              type: {
                  attribute: {
                      defaultValue: "sensor"
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.1.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.1.name'),
              dataType: "DOUBLE",
              type: {
                  attribute: {
                      defaultValue: "25"
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.2.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.2.name'),
              dataType: "DOUBLE",
              type: {
                  attribute: {
                      defaultValue: "15"
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.3.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.3.name'),
              dataType: "STRING",
              type: {
                  measurement: {}
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.4.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.4.name'),
              dataType: "INTEGER",
              type: {
                  measurement: {}
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.5.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.5.name'),
              dataType: "DOUBLE",
              type: {
                  measurement: {}
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.name'),
              dataType: "DOUBLE",
              type: {
                  metric: {
                      expression: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.expression'),
                      variables: [{
                          name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.variables.0.name'),
                          value: {
                              propertyId: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.variables.0.value.propertyId')
                          }
                      }],
                      window: {
                          tumbling: {
                              interval: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.window.tumbling.interval'),
                          }
                      }
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.name'),
              dataType: "DOUBLE",
              type: {
                  metric: {
                      expression: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.expression'),
                      variables: [{
                          name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.variables.0.name'),
                          value: {
                              propertyId: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.variables.0.value.propertyId')
                          }
                      }],
                      window: {
                          tumbling: {
                              interval: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.window.tumbling.interval'),
                          }
                      }
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.name'),
              dataType: "DOUBLE",
              type: {
                  metric: {
                      expression: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.expression'),
                      variables: [{
                          name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.variables.0.name'),
                          value: {
                              propertyId: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.variables.0.value.propertyId')
                          }
                      }],
                      window: {
                          tumbling: {
                              interval: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.window.tumbling.interval'),
                          }
                      }
                  }
              }
          }],
          assetModelCompositeModels: [
            {
                name: "MaxSoilTemp",
                type: "AWS/ALARM",
                properties: [{
                    name: "AWS/ALARM_TYPE",
                    dataType: "STRING",
                    type: {
                        attribute: {
                          defaultValue: "IOT_EVENTS"
                        }
                    }
                }, {
                    name: "AWS/ALARM_STATE",
                    dataType: "STRUCT",
                    dataTypeSpec: "AWS/ALARM_STATE",
                    type: {
                        measurement: {}
                    }
                }]
            },{
              name: "MaxSoilHumi",
              type: "AWS/ALARM",
              properties: [{
                  name: "AWS/ALARM_TYPE",
                  dataType: "STRING",
                  type: {
                      attribute: {
                        defaultValue: "IOT_EVENTS"
                      }
                  }
              }, {
                  name: "AWS/ALARM_STATE",
                  dataType: "STRUCT",
                  dataTypeSpec: "AWS/ALARM_STATE",
                  type: {
                      measurement: {}
                  }
              }]
            }
          ],
        }
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });

    updateAssetModelDouble.node.addDependency(sensorsWithDataTypeDoubleDescribe);

    const siemensSmartfarmAlarmSoilHumiName = 'SiemensSmartfarmAlarmSoilHumi_Demo_LJbQpihcaa0O';
    const siemensSmartfarmAlarmSoilTempName = 'SiemensSmartfarmAlarmSoilTemp_Demo_LJbQpihcaa0O';

    const siemensSmartfarmAlarmSoilHumi = new iotevents.CfnAlarmModel(this, 'SiemensSmartfarmAlarmSoilHumi', {
      alarmRule: {
        simpleRule: {
          comparisonOperator: 'GREATER_OR_EQUAL',
          inputProperty: '$sitewise.assetModel.`' + sensorsWithDataTypeDouble.attrAssetModelId +'`.`' + maxValueId +'`.propertyValue.value',
          threshold: '$sitewise.assetModel.`' + sensorsWithDataTypeDouble.attrAssetModelId +'`.`' + soilHumiNormalId +'`.propertyValue.value',
        },
      },
      roleArn: ioTSiteWiseAccessForIoTEventsRole.roleArn,
    
      // the properties below are optional
      alarmCapabilities: {
        acknowledgeFlow: {
          enabled: true,
        },
        initializationConfiguration: {
          disabledOnInitialization: false,
        },
      },
      alarmModelName: siemensSmartfarmAlarmSoilHumiName,
      alarmModelDescription: 'SiemensSmartfarmAlarmSoilHumi',
      severity: 2,
    });

    siemensSmartfarmAlarmSoilHumi.node.addDependency(sensorsWithDataTypeDoubleDescribe, updateAssetModelDouble);

    const siemensSmartfarmAlarmSoilTemp = new iotevents.CfnAlarmModel(this, 'SiemensSmartfarmAlarmSoilTemp', {
      alarmRule: {
        simpleRule: {
          comparisonOperator: 'GREATER_OR_EQUAL',
          inputProperty: '$sitewise.assetModel.`' + sensorsWithDataTypeDouble.attrAssetModelId +'`.`' + maxValueId +'`.propertyValue.value',
          threshold: '$sitewise.assetModel.`' + sensorsWithDataTypeDouble.attrAssetModelId +'`.`' + soilTempNormalId +'`.propertyValue.value',
        },
      },
      roleArn: ioTSiteWiseAccessForIoTEventsRole.roleArn,
    
      // the properties below are optional
      alarmCapabilities: {
        acknowledgeFlow: {
          enabled: true,
        },
        initializationConfiguration: {
          disabledOnInitialization: false,
        },
      },
      alarmModelDescription: 'SiemensSmartfarmAlarmSoilTemp',
      alarmModelName: siemensSmartfarmAlarmSoilTempName,
      severity: 1,
    });

    siemensSmartfarmAlarmSoilTemp.node.addDependency(sensorsWithDataTypeDoubleDescribe, updateAssetModelDouble);

    const describeAlarmModelHumi = new cr.AwsCustomResource(this, 'describeAlarmModelHumi', {
      onCreate: {
        service: 'IoTEvents',
        action: 'describeAlarmModel',
        physicalResourceId: cr.PhysicalResourceId.of(siemensSmartfarmAlarmSoilHumiName),
        parameters: {
          "alarmModelName": siemensSmartfarmAlarmSoilHumiName
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });
    describeAlarmModelHumi.node.addDependency(siemensSmartfarmAlarmSoilHumi);

    const describeAlarmModelTemp = new cr.AwsCustomResource(this, 'describeAlarmModelTemp', {
      onCreate: {
        service: 'IoTEvents',
        action: 'describeAlarmModel',
        physicalResourceId: cr.PhysicalResourceId.of(siemensSmartfarmAlarmSoilTempName),
        parameters: {
          "alarmModelName": siemensSmartfarmAlarmSoilTempName
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });
    describeAlarmModelTemp.node.addDependency(siemensSmartfarmAlarmSoilTemp);

    // new CfnOutput(this, 'soilHumiNormalId1', { value: describeAlarmModelHumi.getResponseField('alarmModelArn') });
    // new CfnOutput(this, 'soilTempNormalId2', { value: describeAlarmModelTemp.getResponseField('alarmModelArn') });

    const updateAssetModelDouble2 = new cr.AwsCustomResource(this, 'updateAssetModelDouble2', {
      onCreate: {
        service: 'IoTSiteWise',
        action: 'updateAssetModel',
        physicalResourceId: cr.PhysicalResourceId.of(sensorsWithDataTypeDouble.attrAssetModelId),
        parameters: {
          assetModelId: sensorsWithDataTypeDouble.attrAssetModelId, /* required */
          assetModelName: sensorsWithDataTypeDouble.assetModelName, /* required */
          assetModelProperties: [{
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.0.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.0.name'),
              dataType: "STRING",
              type: {
                  attribute: {
                      defaultValue: "sensor"
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.1.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.1.name'),
              dataType: "DOUBLE",
              type: {
                  attribute: {
                      defaultValue: "25"
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.2.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.2.name'),
              dataType: "DOUBLE",
              type: {
                  attribute: {
                      defaultValue: "15"
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.3.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.3.name'),
              dataType: "STRING",
              type: {
                  measurement: {}
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.4.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.4.name'),
              dataType: "INTEGER",
              type: {
                  measurement: {}
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.5.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.5.name'),
              dataType: "DOUBLE",
              type: {
                  measurement: {}
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.name'),
              dataType: "DOUBLE",
              type: {
                  metric: {
                      expression: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.expression'),
                      variables: [{
                          name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.variables.0.name'),
                          value: {
                              propertyId: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.variables.0.value.propertyId')
                          }
                      }],
                      window: {
                          tumbling: {
                              interval: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.6.type.metric.window.tumbling.interval'),
                          }
                      }
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.name'),
              dataType: "DOUBLE",
              type: {
                  metric: {
                      expression: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.expression'),
                      variables: [{
                          name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.variables.0.name'),
                          value: {
                              propertyId: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.variables.0.value.propertyId')
                          }
                      }],
                      window: {
                          tumbling: {
                              interval: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.7.type.metric.window.tumbling.interval'),
                          }
                      }
                  }
              }
          }, {
              id: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.id'),
              name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.name'),
              dataType: "DOUBLE",
              type: {
                  metric: {
                      expression: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.expression'),
                      variables: [{
                          name: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.variables.0.name'),
                          value: {
                              propertyId: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.variables.0.value.propertyId')
                          }
                      }],
                      window: {
                          tumbling: {
                              interval: sensorsWithDataTypeDoubleDescribe.getResponseField('assetModelProperties.8.type.metric.window.tumbling.interval'),
                          }
                      }
                  }
              }
          }],
          assetModelCompositeModels: [
            {
                name: "MaxSoilTemp",
                type: "AWS/ALARM",
                properties: [{
                    name: "AWS/ALARM_TYPE",
                    dataType: "STRING",
                    type: {
                        attribute: {
                          defaultValue: "IOT_EVENTS"
                        }
                    }
                }, {
                    name: "AWS/ALARM_STATE",
                    dataType: "STRUCT",
                    dataTypeSpec: "AWS/ALARM_STATE",
                    type: {
                        measurement: {}
                    }
                },{
                  name: "AWS/ALARM_SOURCE",
                  dataType: "STRING",
                  type: {
                      attribute: {
                        defaultValue: describeAlarmModelTemp.getResponseField('alarmModelArn')
                      }
                  }
                }]
            },{
              name: "MaxSoilHumi",
              type: "AWS/ALARM",
              properties: [{
                  name: "AWS/ALARM_TYPE",
                  dataType: "STRING",
                  type: {
                      attribute: {
                        defaultValue: "IOT_EVENTS"
                      }
                  }
              }, {
                  name: "AWS/ALARM_STATE",
                  dataType: "STRUCT",
                  dataTypeSpec: "AWS/ALARM_STATE",
                  type: {
                      measurement: {}
                  }
              },{
                name: "AWS/ALARM_SOURCE",
                dataType: "STRING",
                type: {
                    attribute: {
                      defaultValue: describeAlarmModelHumi.getResponseField('alarmModelArn')
                    }
                }
              }]
            }
          ],
        }
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });
    updateAssetModelDouble2.node.addDependency(describeAlarmModelTemp, describeAlarmModelHumi);

    const iotsitewiseTrustedPolicy = iam.PolicyStatement.fromJson({     
        "Effect": "Allow",
        "Action": "iotsitewise:BatchPutAssetPropertyValue",
        "Resource": "*"
    });

    const iotsitewisePublishPolicy = iam.PolicyStatement.fromJson({     
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": "*"
    });

    const siteWiseTutorialDeviceRuleRole = new iam.Role(this, 'SiteWiseTutorialDeviceRuleRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com')
    });
    siteWiseTutorialDeviceRuleRole.addToPolicy(iotsitewiseTrustedPolicy);
    siteWiseTutorialDeviceRuleRole.addToPolicy(iotsitewisePublishPolicy);

    const allIoTDevices = [{"name":"SoilTemp","id":"101","dataType":"Real","min":20,"max":30},{"name":"Illumination","id":"102","dataType":"Int","min":10,"max":30},{"name":"AirTemp","id":"103","dataType":"Real","min":20,"max":40},{"name":"SoilHumi","id":"104","dataType":"Real","min":10,"max":30},
    {"name":"CO2","id":"105","dataType":"Int","min":5,"max":30},{"name":"AirHumidity","id":"106","dataType":"Real","min":20,"max":40},{"name":"Auto_Manu","id":"107","dataType":"Bool"},{"name":"Heating","id":"108","dataType":"Bool"},
    {"name":"Pump","id":"109","dataType":"Bool"},{"name":"Fan","id":"110","dataType":"Bool"},{"name":"RedLight","id":"111","dataType":"Bool"},{"name":"BlueLight","id":"112","dataType":"Bool"},{"name":"WhiteLight","id":"113","dataType":"Bool"},
    {"name":"FanManu","id":"114","dataType":"Bool"},{"name":"WhiteLightManu","id":"115","dataType":"Bool"},{"name":"RedLightManu","id":"116","dataType":"Bool"},{"name":"PumpManu","id":"117","dataType":"Bool"},{"name":"HeatingManu","id":"118","dataType":"Bool"},
    {"name":"DAY","id":"119","dataType":"Int","min":0,"max":30},{"name":"BlueLightManu","id":"120","dataType":"Bool"},{"name":"Month","id":"121","dataType":"Int","min":0,"max":12},{"name":"Year","id":"122","dataType":"Int","min":0,"max":100},{"name":"AutoLightTime","id":"123","dataType":"Real","min":0,"max":20},
    {"name":"LongDay","id":"124","dataType":"Bool"},{"name":"ShortDay","id":"125","dataType":"Bool"},{"name":"LightManualStop","id":"126","dataType":"Bool"},{"name":"LightTime","id":"127","dataType":"Real","min":20,"max":40},
    {"name":"LightHalfAuto","id":"128","dataType":"Bool"},{"name":"AgeDays","id":"129","dataType":"Int","min":0,"max":30},{"name":"SetAgeStart","id":"130","dataType":"Bool"}];

    var loopIndex = 0;
    for(loopIndex = 0; loopIndex < allIoTDevices.length; loopIndex++) {
      const device = allIoTDevices[loopIndex];
      if (device['dataType'] == 'Bool') {
        new SitewiseRuleBoolean(this, 'Siemens_SmartFarm_' + device['name'] + '_Demo_LJbQpihcaa0O', {
          deviceId: Number(device['id']),
          deviceName: device['name'],
          roleArn: siteWiseTutorialDeviceRuleRole.roleArn,
          topic: smartFarmTopic,
          ruleName: 'Siemens_SmartFarm_' + device['name'] + '_Sitewise' + '_Demo_LJbQpihcaa0O'
        } );
      } else if  (device['dataType'] == 'Real') {
        new SitewiseRuleReal(this, 'Siemens_SmartFarm_' + device['name'] + '_Demo_LJbQpihcaa0O', {
          deviceId: Number(device['id']),
          deviceName: device['name'],
          roleArn: siteWiseTutorialDeviceRuleRole.roleArn,
          topic: smartFarmTopic,
          ruleName: 'Siemens_SmartFarm_' + device['name'] + '_Sitewise' + '_Demo_LJbQpihcaa0O'
        } );
      } else if  (device['dataType'] == 'Int') {
        new SitewiseRuleInteger(this, 'Siemens_SmartFarm_' + device['name'] + '_Demo_LJbQpihcaa0O', {
          deviceId: Number(device['id']),
          deviceName: device['name'],
          roleArn: siteWiseTutorialDeviceRuleRole.roleArn,
          topic: smartFarmTopic,
          ruleName: 'Siemens_SmartFarm_' + device['name'] + '_Sitewise' + '_Demo_LJbQpihcaa0O'
        } );
      }
    }

    const monitorServicePortalPolicy = iam.PolicyDocument.fromJson({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "iotsitewise:DescribePortal",
                    "iotsitewise:CreateProject",
                    "iotsitewise:DescribeProject",
                    "iotsitewise:UpdateProject",
                    "iotsitewise:DeleteProject",
                    "iotsitewise:ListProjects",
                    "iotsitewise:BatchAssociateProjectAssets",
                    "iotsitewise:BatchDisassociateProjectAssets",
                    "iotsitewise:ListProjectAssets",
                    "iotsitewise:CreateDashboard",
                    "iotsitewise:DescribeDashboard",
                    "iotsitewise:UpdateDashboard",
                    "iotsitewise:DeleteDashboard",
                    "iotsitewise:ListDashboards",
                    "iotsitewise:CreateAccessPolicy",
                    "iotsitewise:DescribeAccessPolicy",
                    "iotsitewise:UpdateAccessPolicy",
                    "iotsitewise:DeleteAccessPolicy",
                    "iotsitewise:ListAccessPolicies",
                    "iotsitewise:DescribeAsset",
                    "iotsitewise:ListAssets",
                    "iotsitewise:ListAssociatedAssets",
                    "iotsitewise:DescribeAssetProperty",
                    "iotsitewise:GetAssetPropertyValue",
                    "iotsitewise:GetAssetPropertyValueHistory",
                    "iotsitewise:GetAssetPropertyAggregates",
                    "iotsitewise:BatchPutAssetPropertyValue",
                    "iotsitewise:ListAssetRelationships",
                    "iotsitewise:DescribeAssetModel",
                    "iotsitewise:ListAssetModels",
                    "iotsitewise:UpdateAssetModel",
                    "iotsitewise:UpdateAssetModelPropertyRouting",
                    "iotevents:DescribeAlarmModel",
                    "iotevents:ListTagsForResource"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iotevents:BatchAcknowledgeAlarm",
                    "iotevents:BatchSnoozeAlarm",
                    "iotevents:BatchEnableAlarm",
                    "iotevents:BatchDisableAlarm"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "iotevents:keyValue": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iotevents:CreateAlarmModel",
                    "iotevents:TagResource"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:RequestTag/iotsitewisemonitor": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iotevents:UpdateAlarmModel",
                    "iotevents:DeleteAlarmModel"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:ResourceTag/iotsitewisemonitor": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iam:PassRole"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "iam:PassedToService": [
                            "iotevents.amazonaws.com"
                        ]
                    }
                }
            }
        ]
    });

    const ioTSiteWiseMonitorServiceRole = new iam.Role(this, 'AWSIoTSiteWiseMonitorServiceRole', {
      assumedBy: new iam.ServicePrincipal("monitor.iotsitewise.amazonaws.com"),
      inlinePolicies: {
        monitorServicePortalPolicy: monitorServicePortalPolicy
      }
    });

    const portalContactEmail = new CfnParameter(this, "portalContactEmail", {
      type: "String",
      default: 'xxx@amazon.com',
      description: "IoT sitewise portal contact email"});

    const smartFarmPortal = new iotsitewise.CfnPortal(this, 'smartFarmPortal', {
      portalContactEmail: portalContactEmail.valueAsString,
      portalName: 'Smart-Farm-Portal Demo-LJbQpihcaa0O',
      roleArn: ioTSiteWiseMonitorServiceRole.roleArn,
      portalAuthMode: 'IAM',
      portalDescription: 'Smart Farm Portal',
    });
    
    const smartFarmProject = new iotsitewise.CfnProject(this, 'smartFarmProject', {
      portalId: smartFarmPortal.attrPortalId,
      projectName: 'SmartFarm Project Demo-LJbQpihcaa0O',
      // the properties below are optional
      assetIds: [smartFarmAsset.attrAssetId],
      projectDescription: 'SmartFarm Project',
    });

    const siemensIndustryEdgeDemoBucket = new s3.Bucket(this, 'siemens-industry-edge-demo');
    this.bucketName = siemensIndustryEdgeDemoBucket.bucketName;

    const smartFarmDataTransferPolicy = iam.PolicyDocument.fromJson({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "iam:PassRole",
                    "iot:*",
                    "logs:*"
                ],
                "Resource": "*"
            }
        ]
    });

    const smarFarmDataTransferRole = new iam.Role(this, 'smarFarmDataTransferRole', {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        smartFarmDataTransferPolicy: smartFarmDataTransferPolicy
      }
    });
    
    const smartFarmDataTransferLambda  = new lambda.Function(this, 'SmartFarmDataTransferLambdaHandler', {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromInline(`exports.handler = (event, context, callback) => {
            let success = 0; // Number of valid entries found
            let failure = 0; // Number of invalid entries found
            var firstLoad = 0;
            /* Process the list of records and transform them */
            const output = event.records.map(record => {
                // Kinesis data is base64 encoded so decode here
                console.log('current recordId:' + record.recordId);
                const payload = (Buffer.from(record.data, 'base64')).toString('utf8');
                //console.log('Decoded payload:', payload);
                // Split the data into it's fields so we can refer to them by index
                const match = JSON.parse(payload);
                console.log('match payload:', match);
                if (match && match.payload && Array.isArray(match.payload.vals) && match.payload.vals.length && match.payload.vals.length > 0) {
                    /* Prepare JSON version from Syslog log data */
                    console.log('match.payload.vals is not null' + match.payload.vals.length);
                    var result1 = '';
                    var rowCommonData = new Array();
                    //add all records item to the recordItems.
                    var recordItems = new Array();
                    for(var k in match) {
                        if (k != 'payload') {
                            recordItems.push(k);
                            rowCommonData.push(match[k]);
                        }
                    }
                    //add all payload data.
                    var titleItems = Array.from(recordItems);
                    for (var k in match.payload) {
                        if (k != 'vals') {
                            titleItems.push('playload.' + k);
                            rowCommonData.push(match.payload[k]);
                        }
                    }
                    var payloadValItems = new Array();
                    for (var k in match.payload.vals[0]) {
                        titleItems.push('playload.vals.' + k);
                        payloadValItems.push(k);
                    }
                    if (firstLoad == 0) {
                        result1 = titleItems.join(',') + "\\n";
                    }
                    match.payload.vals.forEach(function(valsElement) {
                      var valElementData = Array.from(rowCommonData);
                      payloadValItems.forEach(function(valItemName) {
                          valElementData.push(valsElement[valItemName]);
                      });
                      result1 += valElementData.join(',') + "\\n";
                      success++;
                    });
                    console.log('result is :\\n' + result1);
                    firstLoad = 1;
                    return {
                        recordId: record.recordId,
                        result: 'Ok',
                        data: (Buffer.from(result1, 'utf8')).toString('base64'),
                    };
                } else {
                    /* Failed event, notify the error and leave the record intact */
                    failure++;
                    console.log('failed object is:\\n' + record.data)
                }
            });
            console.log('Processing completed.  Successful records ' + success + ', Failed records ' + failure + '.');
            callback(null, { records: output, success: success, failure:failure });
        };`),
        handler: 'index.handler',
        role: smarFarmDataTransferRole,
        timeout: Duration.seconds(300)
    });

    // used to make sure each CDK synthesis produces a different Version
    const version = smartFarmDataTransferLambda.currentVersion;
    const alias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: 'Prod',
      version,
    });

    new codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
      alias,
      deploymentConfig: codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });

    const smartFarmPutS3DeliveryFireHosePolicy = iam.PolicyDocument.fromJson({
      "Version": "2012-10-17",
      "Statement": [
          {
              "Sid": "",
              "Effect": "Allow",
              "Action": [
                  "s3:AbortMultipartUpload",
                  "s3:GetBucketLocation",
                  "s3:GetObject",
                  "s3:ListBucket",
                  "s3:ListBucketMultipartUploads",
                  "s3:PutObject"
              ],
              "Resource": [
                siemensIndustryEdgeDemoBucket.bucketArn,
                siemensIndustryEdgeDemoBucket.bucketArn + "/*"
              ]
          },
          {
              "Sid": "",
              "Effect": "Allow",
              "Action": [
                  "lambda:InvokeFunction",
                  "lambda:GetFunctionConfiguration"
              ],
              "Resource": "*"
          },
          {
              "Effect": "Allow",
              "Action": [
                  "kms:GenerateDataKey",
                  "kms:Decrypt"
              ],
              "Resource": [
                  "*"
              ],
          },
          {
              "Sid": "",
              "Effect": "Allow",
              "Action": [
                  "logs:PutLogEvents"
              ],
              "Resource": [
                  "*",
              ]
          },
          {
              "Sid": "",
              "Effect": "Allow",
              "Action": [
                  "kinesis:DescribeStream",
                  "kinesis:GetShardIterator",
                  "kinesis:GetRecords",
                  "kinesis:ListShards"
              ],
              "Resource": "*"
          }
      ]
    });

    const smartFarmPutS3DeliveryFirehoseRole = new iam.Role(this, 'smartFarmPutS3DeliveryFirehoseRole', {
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
      inlinePolicies: {
        smartFarmPutS3DeliveryFireHosePolicy: smartFarmPutS3DeliveryFireHosePolicy
      }
    });

    const loggroup = new logs.LogGroup(this, '/aws/kinesisfirehose/SmartFarm-PUT-S3-Demo-LJbQpihcaa0O');
    loggroup.addStream('DestinationDelivery',{logStreamName:'DestinationDelivery'});

    const deliveryStreamName = 'SiemensStack-SmartFarm-PUT-S3'; 
    const smartFarmPutS3DeliveryFirehose = new kinesisfirehose.CfnDeliveryStream(this, 'SmartFarm-PUT-S3-Demo-LJbQpihcaa0O', /* all optional props */ {
      deliveryStreamType: 'DirectPut',
      deliveryStreamName: deliveryStreamName, 
      extendedS3DestinationConfiguration: {
        bucketArn: siemensIndustryEdgeDemoBucket.bucketArn,
        roleArn: smartFarmPutS3DeliveryFirehoseRole.roleArn,
    
        // the properties below are optional
        bufferingHints: {
          intervalInSeconds: 300,
          sizeInMBs: 5,
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: loggroup.logGroupName,
          logStreamName: 'DestinationDelivery',
        },
        compressionFormat: 'UNCOMPRESSED',
        dynamicPartitioningConfiguration: {
          enabled: false,
          retryOptions: {
            durationInSeconds: 60,
          },
        },
        processingConfiguration: {
          enabled: true,
          processors: [{
            type: 'Lambda',
    
            // the properties below are optional
            parameters: [{
              parameterName: 'BufferIntervalInSeconds',
              parameterValue: '300',
            },{
              parameterName: 'BufferSizeInMBs',
              parameterValue: '3',
            },{
              parameterName: 'LambdaArn',
              parameterValue: smartFarmDataTransferLambda.functionArn,
            }],
          }],
        },
        s3BackupMode: 'Disabled',
      },
    });

    const firehosePutS3Policy = iam.PolicyDocument.fromJson({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "firehose:PutRecord",
                    "firehose:PutRecordBatch"
                ],
                "Resource": smartFarmPutS3DeliveryFirehose.attrArn
            }
        ]
    });

    const smartFarmIOT2S3Role = new iam.Role(this, 'smartFarmIOT2S3Role', {
      assumedBy: new iam.ServicePrincipal("iot.amazonaws.com"),
      inlinePolicies: {
        firehosePutS3Policy: firehosePutS3Policy
      }
    });

    const smartFarmIOT2S3TopicRule = new iot.CfnTopicRule(this, 'SmartFarmIOT2S3TopicRuleDemoLJbQpihcaa0O', {
      topicRulePayload: {
        actions: [{
          firehose: {
            deliveryStreamName: deliveryStreamName,
            roleArn: smartFarmIOT2S3Role.roleArn,
    
            // the properties below are optional
            batchMode: false,
          },}],
        awsIotSqlVersion: '2016-03-23',
        sql: "select * from \'" + smartFarmTopic + "\'",
        description: 'description',
        errorAction: {
          republish: {
            roleArn: siteWiseTutorialDeviceRuleRole.roleArn,
            topic: 'errormessage',
            qos: 0,
          },
        },
        ruleDisabled: false,
      },
    });

    const smartfarmS3Crawler = iam.PolicyDocument.fromJson({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:DeleteObject"
                ],
                "Resource": siemensIndustryEdgeDemoBucket.bucketArn + "*"
            }
        ]
    });
    
    const smartfarmCrawlerRole = new iam.Role(this, 'SmartfarmCrawlerRole', {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      inlinePolicies: {
        smartfarmS3Crawler: smartfarmS3Crawler
      },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole')]
    });

    const databaseName = 'smartfarm-smartfarm-demoljbqpihcaa';
    const smartfarmDemoGlueDatabase = new glue.CfnDatabase(this, 'SmartFarm-SmartfarmDemo', {
      catalogId: Stack.of(this).account,
      databaseInput: {
        name: databaseName,
      }
    });


    const smartFarmDataCrawler = new glue.CfnCrawler(this, 'SmartFarmDataCrawler', {
      role: smartfarmCrawlerRole.roleArn,
      targets: {
        s3Targets: [{
          exclusions: ['processing-failed/**','rawdataparquet/**'],
          path: "s3://" + siemensIndustryEdgeDemoBucket.bucketName,
        }],
      },
      schemaChangePolicy: {
        updateBehavior: 'LOG',
        deleteBehavior: 'LOG'
      },
      
      databaseName: databaseName,
      description: 'SmartFarmDataCrawler',
      tablePrefix: 'rawdata_'
    });

    const smartFarmDataCrawlerParquet = new glue.CfnCrawler(this, 'smartFarmDataCrawlerParquet', {
      role: smartfarmCrawlerRole.roleArn,
      targets: {
        s3Targets: [{
          exclusions: ['processing-failed/**','rawdataparquet/**'],
          path: "s3://" + siemensIndustryEdgeDemoBucket.bucketName + "/rawdataparquet",
        }],
      },
      schemaChangePolicy: {
        updateBehavior: 'LOG',
        deleteBehavior: 'LOG'
      },
      
      databaseName: databaseName,
      description: 'SmartFarmDataCrawlerParquet',
      tablePrefix: 'parquet_data_'
    });

    const thingName = new CfnParameter(this, "thingName", {
      type: "String",
      default: "SiemensSmartFarmDemo",
      description: "The name of the thing which will be created."});

    new iot.CfnThing(this, 'SmartFarmThing', /* all optional props */ {
      thingName: thingName.valueAsString,
    });

    const create_keys_and_certificate = new cr.AwsCustomResource(
      this,
      "CreateKeysAndCertificate", {
        onCreate: {
          service: "Iot",
          action: "createKeysAndCertificate",
          parameters: {
            setAsActive: true
          },
          physicalResourceId: cr.PhysicalResourceId.fromResponse('certificateId'),
          outputPaths:["certificateArn","certificateId","certificatePem","keyPair.PrivateKey"]
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );
    
    const cfnPolicyName = 'SiemensStack-SmartFarmPolicy-JU5ZKA6SCK5R';
    new iot.CfnPolicy(this, 'SmartFarmPolicy', {
      policyDocument: {
          "Version":"2012-10-17",
          "Statement":[
            {
                "Effect":"Allow",
                "Action":[
                  "iot:*"
                ],
                "Resource":[
                  "*"
                ]
            }
          ]
      },
      policyName: cfnPolicyName
    });

    const certParameterStore = new ssm.StringParameter(this, 'certificatePem', {
      description: 'certificatePem',
      parameterName: '/smartfarm/certificatePem',
      stringValue: create_keys_and_certificate.getResponseField('certificatePem'),
      tier: ssm.ParameterTier.ADVANCED,
    });

    const privateKeyParameterStore = new ssm.StringParameter(this, 'PrivateKey', {
      description: 'PrivateKey',
      parameterName: '/smartfarm/keyPair/PrivateKey',
      stringValue: create_keys_and_certificate.getResponseField('keyPair.PrivateKey'),
      tier: ssm.ParameterTier.ADVANCED,
    });

    const certificateArn = create_keys_and_certificate.getResponseField('certificateArn');

    const ioTEndpointCustomResource = new cr.AwsCustomResource(this, 'IoTEndpoint', {
      onCreate: {
        service: 'Iot',
        action: 'describeEndpoint',
        physicalResourceId: cr.PhysicalResourceId.fromResponse('endpointAddress'),
        parameters: {
          "endpointType": "iot:Data-ATS"
        }
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });

    const endPointUrl = ioTEndpointCustomResource.getResponseField('endpointAddress');

    new iot.CfnPolicyPrincipalAttachment(this, 'MyCfnPolicyPrincipalAttachment', {
      policyName: cfnPolicyName,
      principal: certificateArn,
    });
    
    new iot.CfnThingPrincipalAttachment(this, 'MyCfnThingPrincipalAttachment', {
      "principal": certificateArn,
      "thingName": thingName.valueAsString
    });

    const privateKey = '/certs/private.pem';
    const certName = '/certs/cert.pem';

    new CfnOutput(this, 'IoT SiteWise Portal URL', { value: smartFarmPortal.attrPortalStartUrl, description: 'IoT Sitewise Portal URL' });
    new CfnOutput(this, 'S3 Bucket Name', {value: siemensIndustryEdgeDemoBucket.bucketName, description: 'The S3 bucket URL'});
    new CfnOutput(this, 'Device data endpoint URL', { value: endPointUrl, description: 'Device Data enpoint URL for IoT' });
    const urlSuffix = Condition.stringEquals(Aws.REGION, 'cn-north-1') ? 'amazonaws.cn' : Aws.URL_SUFFIX;
    new CfnOutput(this, 'IoT Certificate Key URL', { value: "https://console." + urlSuffix + "/systems-manager/parameters/smartfarm/certificatePem/description?region="+Aws.REGION+"&tab=Table",  description: 'You can copy the certificate Key value to a file'});
    new CfnOutput(this, 'Certificate Private Key URL', { value: "https://console." + urlSuffix + "/systems-manager/parameters/smartfarm/keyPair/PrivateKey/description?region="+Aws.REGION+"&tab=Table",  description: 'You can copy the private Key value to a file' });

    /*new s3deploy.BucketDeployment(this, 'writedatatoS3', {
      sources: [s3deploy.Source.data(privateKey, create_keys_and_certificate.getResponseField('keyPair.PrivateKey')),s3deploy.Source.data(certName, create_keys_and_certificate.getResponseField('certificatePem'))],
      destinationBucket: siemensIndustryEdgeDemoBucket,
    });*/

    const mockEC2Enbaled = this.node.tryGetContext('mockEC2Enbaled');

    if (mockEC2Enbaled == "Yes") {

      // Create new VPC with 2 Subnets
      const vpc = new ec2.Vpc(this, 'SmartFarmVPC', {
        natGateways: 0,
        maxAzs: 99,
        enableDnsHostnames:true,
        enableDnsSupport:true,

        subnetConfiguration: [{
          cidrMask: 24,
          name: "smartfarmdemo",
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        }]
      });

      // Allow SSH (TCP Port 22) access from anywhere
      const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
        vpc,
        description: 'Allow SSH (TCP port 22) in',
        allowAllOutbound: true
      });
      securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access')

      const role = new iam.Role(this, 'ec2Role', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      });
      role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
      
      const ami = new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: ec2.AmazonLinuxCpuType.X86_64
      });

      // Create the instance using the Security Group, AMI, and KeyPair defined in the VPC created
      const ec2Instance = new ec2.Instance(this, 'Instance', {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: ami,
        securityGroup: securityGroup,
        role: role
      });

      const pubsubcode = Fn.base64(`from awscrt import mqtt

import sys
import threading
import time
from uuid import uuid4
import json
from datetime import datetime, timezone
import random
from awsiot import mqtt_connection_builder

received_count = 0
received_all_event = threading.Event()

def on_connection_interrupted(connection, error, **kwargs):
    print("Connection interrupted. error: {}".format(error))

def on_connection_resumed(connection, return_code, session_present, **kwargs):
    print("Connection resumed. return_code: {} session_present: {}".format(return_code, session_present))

    if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
        print("Session did not persist. Resubscribing to existing topics...")
        resubscribe_future, _ = connection.resubscribe_existing_topics()
        resubscribe_future.add_done_callback(on_resubscribe_complete)

def on_resubscribe_complete(resubscribe_future):
        resubscribe_results = resubscribe_future.result()
        print("Resubscribe results: {}".format(resubscribe_results))

        for topic, qos in resubscribe_results['topics']:
            if qos is None:
                sys.exit("Server rejected resubscribe to topic: {}".format(topic))

def on_message_received(topic, payload, dup, qos, retain, **kwargs):
    print("Received message from topic '{}': {}".format(topic, payload))
    global received_count
    received_count += 1

def build_mqtt_connection(on_connection_interrupted, on_connection_resumed):
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint='` + endPointUrl + `',
        cert_filepath='cert.pem',
        pri_key_filepath='private.pem',
        ca_filepath='ca.pem',
        on_connection_interrupted=on_connection_interrupted,
        on_connection_resumed=on_connection_resumed,
        port=443,
        client_id='test_farm',
        clean_session=False,
        keep_alive_secs=30)
    return mqtt_connection

if __name__ == '__main__':
    mqtt_connection = build_mqtt_connection(on_connection_interrupted, on_connection_resumed)
    deviceMetadata = [{"name":"SoilTemp","id":"101","dataType":"Real","min":20,"max":30},{"name":"Illumination","id":"102","dataType":"Int","min":10,"max":30},{"name":"AirTemp","id":"103","dataType":"Real","min":20,"max":40},{"name":"SoilHumi","id":"104","dataType":"Real","min":10,"max":30},
    {"name":"AirHumidity","id":"106","dataType":"Real","min":20,"max":40},{"name":"Auto_Manu","id":"107","dataType":"Bool"},{"name":"Heating","id":"108","dataType":"Bool"},
    {"name":"Pump","id":"109","dataType":"Bool"},{"name":"Fan","id":"110","dataType":"Bool"},{"name":"RedLight","id":"111","dataType":"Bool"},{"name":"BlueLight","id":"112","dataType":"Bool"},{"name":"WhiteLight","id":"113","dataType":"Bool"},
    {"name":"FanManu","id":"114","dataType":"Bool"},{"name":"WhiteLightManu","id":"115","dataType":"Bool"},{"name":"RedLightManu","id":"116","dataType":"Bool"},{"name":"PumpManu","id":"117","dataType":"Bool"},{"name":"HeatingManu","id":"118","dataType":"Bool"},
    {"name":"DAY","id":"119","dataType":"Int","min":0,"max":30},{"name":"BlueLightManu","id":"120","dataType":"Bool"},{"name":"Month","id":"121","dataType":"Int","min":0,"max":12},{"name":"Year","id":"122","dataType":"Int","min":0,"max":100},{"name":"AutoLightTime","id":"123","dataType":"Real","min":0,"max":20},
    {"name":"LongDay","id":"124","dataType":"Bool"},{"name":"ShortDay","id":"125","dataType":"Bool"},{"name":"LightManualStop","id":"126","dataType":"Bool"},{"name":"LightTime","id":"127","dataType":"Real","min":20,"max":40},
    {"name":"LightHalfAuto","id":"128","dataType":"Bool"},{"name":"AgeDays","id":"129","dataType":"Int","min":0,"max":30},{"name":"SetAgeStart","id":"130","dataType":"Bool"}];
    connect_future = mqtt_connection.connect()
    connect_future.result()
    print("Connected!")

    message_count = 10000
    message_topic = '` + smartFarmTopic+ `'

    print("Subscribing to topic '{}'...".format(message_topic))
    subscribe_future, packet_id = mqtt_connection.subscribe(
        topic=message_topic,
        qos=mqtt.QoS.AT_LEAST_ONCE,
        callback=on_message_received)

    subscribe_result = subscribe_future.result()
    print("Subscribed with {}".format(str(subscribe_result['qos'])))

    if message_count == 0:
        print ("Sending messages until program killed")
    else:
        print ("Sending {} message(s)".format(message_count))
    publish_count = 1
    while (publish_count <= message_count) or (message_count == 0):
        timestr = datetime.utcnow().isoformat()[:-3] + 'Z'
        vals = [];
        randomArray = random.sample(range(1,28),random.randint(1, 10));
        for item in randomArray:
            objectItem = deviceMetadata[item-1];
            if objectItem['dataType'] == 'Bool' :
                vals.append({"id":objectItem['id'],"qc":3,"ts":timestr,"val":random.randint(0,1)});
            elif objectItem['dataType'] == 'Int' :
                vals.append({"id":objectItem['id'],"qc":3,"ts":timestr,"val":random.randint(objectItem['min'],objectItem['max'])});
            elif objectItem['dataType'] == 'Real' :
                vals.append({"id":objectItem['id'],"qc":3,"ts":timestr,"val":random.uniform(objectItem['min'],objectItem['max'])});
        vals.append({"id":105,"qc":3,"ts":timestr,"val":random.randint(10,40)});
        message_json={"clientID": "AWSUSEXTVP","topic": "devicetopic","protocol": "mqtt","payload": {"seq": random.randint(1,10000000), "vals": vals}}
        message_send = json.dumps(message_json)
        print("Publishing message to topic '{}': {}".format(message_topic, message_send))
        mqtt_connection.publish(
            topic=message_topic,
            payload=message_send,
            qos=mqtt.QoS.AT_LEAST_ONCE)
        time.sleep(1)
        publish_count += 1
    if message_count != 0 and not received_all_event.is_set():
        print("Waiting for all messages to be received...")

    received_all_event.wait()
    print("{} message(s) received.".format(received_count))
    # Disconnect
    print("Disconnecting...")
    disconnect_future = mqtt_connection.disconnect()
    disconnect_future.result()
    print("Disconnected!")
    `);

      ec2Instance.userData.addCommands('python3 -m pip install awsiotsdk;cd /home/ec2-user;',
        "echo '" + pubsubcode + "'| base64 -d > /home/ec2-user/iotpubsub.py;",
        "echo '" + create_keys_and_certificate.getResponseField('certificatePem') + "' > /home/ec2-user/cert.pem",
        "echo '" + create_keys_and_certificate.getResponseField('keyPair.PrivateKey') + "' > /home/ec2-user/private.pem",
        "curl 'https://www.amazontrust.com/repository/AmazonRootCA1.pem' -o ca.pem;",
        "chown ec2-user:ec2-user *;nohup python3 iotpubsub.py > nohup.out;",
      );

    }

    const dataAnalysisBucket = new s3.Bucket(this, "siemens-smartfarm-data-analysis", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: false,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const sagemakerExecutionRole = new iam.Role(this, "sagemaker-execution-role", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "personalize-full-access",
          "arn:aws:iam::aws:policy/service-role/AmazonPersonalizeFullAccess"
        ),
      ],
      inlinePolicies: {
        s3Buckets: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: [dataAnalysisBucket.bucketArn,siemensIndustryEdgeDemoBucket.bucketArn],
              actions: ["s3:ListBucket"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: [`${dataAnalysisBucket.bucketArn}/*`,`${siemensIndustryEdgeDemoBucket.bucketArn}/*`],
              actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            }),
          ],
        }),
      },
    });

    new sagemaker.CfnNotebookInstance(this, "notebook-instance", {
      instanceType: 'ml.m5.xlarge',
      roleArn: sagemakerExecutionRole.roleArn,
      volumeSizeInGb: 30,
      defaultCodeRepository: 'https://github.com/FrankieCheng/smartfarmdemo.git'
    });
  }
}
